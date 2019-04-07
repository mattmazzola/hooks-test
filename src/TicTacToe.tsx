import React from 'react'

const hasWin = (board: number[], defaultValue = -1): boolean => {
    const three = Array(3).fill(0)

    // Check rows 012, 345, 678
    const rowWin = three.some((_, i) => {
        const offset = i * 3
        return three.every((_, j) => {
            const position = offset + j
            return board[position] !== defaultValue
                && board[offset] !== defaultValue
                && board[position] === board[offset]
        })
    })

    if (rowWin) {
        return true
    }

    // Check columns 036, 147, 258
    const colWin = three.some((_, i) => {
        const offset = i
        return three.every((_, j) => {
            const position = offset + (j * 3)
            return board[position] !== defaultValue
                && board[offset] !== defaultValue
                && board[position] === board[offset]
        })
    })

    if (colWin) {
        return true
    }

    // Check diagonals, 048, 246
    if (board[0] === board[4]
        && board[4] === board[8]
        && board[4] !== defaultValue) {
        return true
    }
    if (board[2] === board[4]
        && board[4] === board[6]
        && board[4] !== defaultValue) {
        return true
    }


    return false
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