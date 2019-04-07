import React from 'react'

const hasWin = (board: number[]): boolean => {
    const three = Array(3).fill(0)

    // Check rows 012, 345, 678
    const rowWin = three.some((_, i) => {
        const offset = i * 3
        return three.every((_, j) => {
            const position = offset + j
            return board[position] !== -1
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
            return board[position] !== -1
                && board[position] === board[offset]
        })
    })

    if (colWin) {
        return true
    }

    // Check diagonals

    return false
}

export function useTicTacToe() {
    const [player, setPlayer] = React.useState(true)
    const [hasWon, setHasWon] = React.useState(false)
    const [board, setBoard] = React.useState(Array(9).fill(-1))
    const clickPosition = (board: number[], position: number, player: boolean) => {
        board[position] = player ? 1 : 0

        const win = hasWin(board)
        setBoard(board)
        if (win) {
            setHasWon(true)
        }
        else {
            setPlayer(p => !p)
        }
    }

    return {
        board,
        player,
        hasWon,
        clickPosition
    }
}

export const TicTacToe: React.FC = () => {
    const { board, player, hasWon, clickPosition } = useTicTacToe()

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