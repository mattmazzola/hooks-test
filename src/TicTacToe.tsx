import React from 'react'

const hasWin = (squares: number[], defaultValue = -1): boolean => {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ]

    return lines.some(line => {
        const [a, b, c] = line
        return squares[a] !== defaultValue
            && squares[a] === squares[b]
            && squares[a] === squares[c]
    })
}

export function useTicTacToe() {
    const defaultValue = -1
    const [player, setPlayer] = React.useState(true)
    const [hasWon, setHasWon] = React.useState(false)
    const [board, setBoard] = React.useState(Array(9).fill(defaultValue))

    const clickPosition = (board: number[], position: number, player: boolean) => {
        if (hasWon) {
            return
        }

        const nextBoard = [...board]
        nextBoard[position] = player ? 1 : 0
        const win = hasWin(nextBoard, defaultValue)
        setBoard(nextBoard)
        if (win) {
            setHasWon(true)
        }
        else {
            setPlayer(p => !p)
        }
    }

    const reset = () => {
        setBoard(Array(9).fill(defaultValue))
        setPlayer(true)
        setHasWon(false)
    }

    return {
        board,
        player,
        hasWon,
        clickPosition,
        reset,
    }
}

export const TicTacToe: React.FC = () => {
    const { board, player, hasWon, clickPosition, reset } = useTicTacToe()

    return (
        <>
            <div className="tic-tac-toe">
                {board.map((position, i) =>
                    <div key={i}>
                        {position === 0
                            && <div>0</div>}

                        {position === 1
                            && <div>1</div>}

                        {position === -1
                            && <button onClick={() => clickPosition(board, i, player)}>X</button>}
                    </div>
                )}
            </div>
            <div>
                <button onClick={() => reset()}>Reset</button>
                {hasWon
                    ? `Player ${player ? 1 : 2} has won!`
                    : player
                        ? "Player 1"
                        : "Player 2"}
            </div>
        </>
    )
}

export const PickX: React.FC = () => {
    return (
        <div>
            X
        </div>
    )
}

export const PickO: React.FC = () => {
    return (
        <div>
            O
        </div>
    )
}

export default TicTacToe