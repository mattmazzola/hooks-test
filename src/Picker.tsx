import React from 'react'
import PickerStyles from './Picker.module.css'
import Fuse from 'fuse.js'
import './FuseMatch.css'

export interface IOption {
    name: string
}

export type Props = {
    options: IOption[]
    onClickNewOption: () => void
    maxDisplayedOptions: number
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

    if (lastIndex < text.length) {
        adjacentIndicies.push({
            indices: [lastIndex, text.length],
            matched: false
        })
    }

    return adjacentIndicies
}

const getMatchedOptions = (searchText: string, options: IOption[], fuse: Fuse<IOption>, maxDisplayedOptions: number): MatchedOption<IOption>[] => {
    return searchText.trim().length === 0
        ? options
            .filter((_, i) => i < maxDisplayedOptions)
            .map(convertOptionToMatchedOption)
        : (fuse.search(searchText) as any[])
            .filter((_, i) => i < maxDisplayedOptions)
            .map((result: Fuse.FuseResult<IOption>) => {
                const matches = convertTextAndMatchedIndiciesToMatchedText(result.item.name, result.matches[0].indices)
                return convertMatchedTextIntoMatchedOption(result.item.name, result.matches[0].indices, result.item)
            })
}

type IndexFunction = (x: number, limit: number) => number
// TODO: Id function doesn't need limit but TS requires consistent arguments
const id = (x: number) => x
const increment = (x: number, limit: number) => (x + 1) > limit ? 0 : x + 1
const decrement = (x: number, limit: number) => (x - 1) < 0 ? limit : x - 1


const usePicker = (options: IOption[],
    maxDisplayedOptions: number,
    onSelectOption: (option: IOption) => void,
) => {
    const fuseRef = React.useRef(new Fuse(options, fuseOptions))
    const [searchText, setSearchText] = React.useState('')
    const [highlightIndex, setHighlighIndex] = React.useState(0)
    const [matchedOptions, setMatchedOptions] = React.useState<MatchedOption<IOption>[]>([])

    React.useEffect(() => {
        fuseRef.current.setCollection(options)
        const computed = getMatchedOptions(searchText, options, fuseRef.current, maxDisplayedOptions)
        setMatchedOptions(computed)
    }, [options.length, searchText])

    const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
        let modifyFunction: IndexFunction = id
        switch (event.key) {
            case 'ArrowUp': {
                modifyFunction = decrement
                break;
            }
            case 'ArrowDown':
                modifyFunction = increment
                break;
            case 'Enter':
            case 'Tab':
                // Only simulate completion on 'forward' tab
                if (event.shiftKey) {
                    return
                }

                onSelectHighlightedOption()
                event.stopPropagation()
                event.preventDefault()
                break;
        }

        setHighlighIndex(modifyFunction(highlightIndex, matchedOptions.length - 1))
    }

    const onClickOption = (option: IOption) => onSelectOption(option)
    const onSelectHighlightedOption = () => {
        const option = matchedOptions[highlightIndex]
        if (option) {
            onSelectOption(option.original)
        }
    }

    return {
        searchText,
        setSearchText,
        onKeyDown,
        matchedOptions,
        onClickOption,
        highlightIndex,
    }
}

export const Picker: React.FC<Props> = (props) => {
    const { searchText, setSearchText, onKeyDown, matchedOptions, onClickOption, highlightIndex } = usePicker(
        props.options,
        props.maxDisplayedOptions,
        o => console.log(`selected: `, o),
    )

    return <div className={PickerStyles.picker}>
        <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} onKeyDown={onKeyDown} />
        <button onClick={props.onClickNewOption}>New Option</button>
        <div className={PickerStyles.list}>
            {matchedOptions.map((matchedOption, i) =>
                <button
                    className={`${PickerStyles.picker__option} ${i === highlightIndex ? PickerStyles.picker__option__highlighted : ''}`}
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
