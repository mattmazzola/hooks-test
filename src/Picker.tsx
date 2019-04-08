import React from 'react'
import PickerStyles from './Picker.module.css'
import Fuse from 'fuse.js'
import './FuseMatch.css'

export interface IOption {
    name: string
}

export type Props = {
    options: IOption[]
}

export interface MatchedOption<T> {
    highlighted: boolean
    matchedStrings: MatchedString[]
    original: T
}

export interface MatchedIndex {
    indices: [number, number]
    matched: boolean
}

export interface MatchedString {
    text: string
    matched: boolean
}

/**
 * See http://fusejs.io/ for information about options meaning and configuration
 */
const fuseOptions: Fuse.FuseOptions<IOption> = {
    shouldSort: true,
    includeMatches: true,
    threshold: 0.5,
    location: 0,
    distance: 30,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: [
        "name"
    ]
}

export interface ISegement {
    text: string
    startIndex: number
    endIndex: number
    data: any
}

/**
 * Display Fuse.io search match with characters from search input having custom style such as highlight or bold
 */
export const FuseMatch: React.FC<{ matches: any[] }> = ({ matches }) => {
    return <span>{matches.map((m, i) => <span className={`match-string ${m.matched ? 'match-string--matched' : ''}`} key={i}>{m.text}</span>)}</span>
}

const convertOptionToMatchedOption = (option: IOption): MatchedOption<IOption> => {
    return {
        highlighted: false,
        matchedStrings: [{ text: option.name, matched: false }],
        original: option
    }
}

/**
 * Converts text with matching indicies to matched text objects
 * 
 * Example:
 * inputText: 'harness real-time'
 * matches: [
    [0, 2]
    [4, 4]
    [7, 10]
    [16, 16]
 ]
 * Each match splits the existing text segment into more segements
 * If the split is on the end it may result in empty segments which are discarded
 * 
 *     0 2
 * 1. 'har' 'ness real-time"
 *     0 2       4
 * 2. 'har' 'n' 'e' 'ss real-time'
 *     0 2       4        7  10
 * 3. 'har' 'n' 'e' 'ss' ' real' '-time'
 *     0 2       4        7  10          16
 * 3. 'har' 'n' 'e' 'ss' ' real' '-tim' 'e'
 *
 * Outputs matched options:
 * [
    {
        text: 'har'
        matched: true
    },
    {
        text: 'n',
        matched: false
    }
    ...
 * ]
 *
 * An alternate would be to combine all the indicies weigh the match and then slice the string at the end.
 */
export const convertMatchedTextIntoMatchedOption = <T, R>(inputText: string, matches: [number, number][], original: T): MatchedOption<T> => {
    const matchedStrings = matches.reduce<ISegement[]>((segements, [startIndex, originalEndIndex]) => {
        const endIndex = originalEndIndex + 1
        const segementIndexWhereEntityBelongs = segements.findIndex(seg => seg.startIndex <= startIndex && endIndex <= seg.endIndex)
        const prevSegements = segements.slice(0, segementIndexWhereEntityBelongs)
        const nextSegements = segements.slice(segementIndexWhereEntityBelongs + 1, segements.length)
        const segementWhereEntityBelongs = segements[segementIndexWhereEntityBelongs]

        const prevSegementEndIndex = startIndex - segementWhereEntityBelongs.startIndex
        const prevSegementText = segementWhereEntityBelongs.text.substring(0, prevSegementEndIndex)
        const prevSegement: ISegement = {
            ...segementWhereEntityBelongs,
            text: prevSegementText,
            endIndex: startIndex,
        }

        const nextSegementStartIndex = endIndex - segementWhereEntityBelongs.startIndex
        const nextSegementText = segementWhereEntityBelongs.text.substring(nextSegementStartIndex, segementWhereEntityBelongs.text.length)
        const nextSegement: ISegement = {
            ...segementWhereEntityBelongs,
            text: nextSegementText,
            startIndex: endIndex,
        }

        const newSegement: ISegement = {
            text: segementWhereEntityBelongs.text.substring(prevSegementEndIndex, nextSegementStartIndex),
            startIndex: startIndex,
            endIndex: endIndex,
            data: {
                matched: true
            }
        }

        const newSegements = []
        if (prevSegement.startIndex !== prevSegement.endIndex) {
            newSegements.push(prevSegement)
        }

        if (newSegement.startIndex !== newSegement.endIndex) {
            newSegements.push(newSegement)
        }

        if (nextSegement.startIndex !== nextSegement.endIndex) {
            newSegements.push(nextSegement)
        }

        return [...prevSegements, ...newSegements, ...nextSegements]
    }, [
            {
                text: inputText,
                startIndex: 0,
                endIndex: inputText.length,
                data: {
                    matched: false
                }
            }
        ]).map(({ text, data }) => ({
            text,
            matched: data.matched
        }))

    return {
        highlighted: false,
        original,
        matchedStrings
    }
}

export const convertTextAndMatchedIndiciesToMatchedText = (text: string, indicies: [number, number][]): MatchedIndex[] => {
    let lastIndex = 0
    const adjacentIndicies = indicies.map(([start, end]) => {
        const indexMatches: MatchedIndex[] = []
        if (start > lastIndex) {
            indexMatches.push({
                indices: [lastIndex, start],
                matched: false
            })
        }

        indexMatches.push({
            indices: [start, end + 1],
            matched: true
        })
        lastIndex = end + 1

        return indexMatches
    }).reduce((a, b) => [...a, ...b], [])

    if(lastIndex < text.length) {
        adjacentIndicies.push({
            indices: [lastIndex, text.length],
            matched: false
        })
    }

    return adjacentIndicies
}

const getMatchedOptions = (searchText: string, options: IOption[], fuse: Fuse<IOption>): MatchedOption<IOption>[] => {
    return searchText.trim().length === 0
        ? options.map(convertOptionToMatchedOption)
        : (() => {
            const search = (fuse.search(searchText) as any[])
            console.log({ search })
            return search
        })()
            .map((result: Fuse.FuseResult<IOption>) => {
                const matches = convertTextAndMatchedIndiciesToMatchedText(result.item.name, result.matches[0].indices)
                console.log({ text: result.item.name, matches })
                return convertMatchedTextIntoMatchedOption(result.item.name, result.matches[0].indices, result.item)
            })
}

export const Picker: React.FC<Props> = (props) => {
    const fuseRef = React.useRef(new Fuse(props.options, fuseOptions))
    const [searchText, setSearchText] = React.useState('')
    const [highlightIndex, setHighlighIndex] = React.useState(0)
    const [matchedOptions, setMatchedOptions] = React.useState(() => getMatchedOptions(searchText, props.options, fuseRef.current))

    React.useEffect(() => {
        fuseRef.current.setCollection(props.options)
        const computed = getMatchedOptions(searchText, props.options, fuseRef.current)
        setMatchedOptions(computed)
    }, [props.options.length, searchText])

    const onKeyDown = (key: string) => {
        if (key !== 'Enter') {
            return
        }

        const trimmedText = searchText.trim()
    }

    const onClickNewOption = () => console.log(`onClickNewOption`)
    const onClickOption = (option: IOption) => console.log('option: ', option)

    console.log({ matchedOptions })
    React.useDebugValue(`This is debug value: ${matchedOptions}`)

    return <div className={PickerStyles.picker}>
        <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} onKeyDown={e => onKeyDown(e.key)} />
        <button onClick={() => onClickNewOption()}>New Option</button>
        <div className={PickerStyles.list}>
            {matchedOptions.map((matchedOption, i) =>
                <button
                    className={PickerStyles.picker__option}
                    key={i}
                    onClick={() => onClickOption(matchedOption.original)}
                >
                    <FuseMatch matches={matchedOption.matchedStrings} />
                </button>
            )}
        </div>
    </div>
}

export default Picker
