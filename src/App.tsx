import React from 'react';
import './App.css';
import TicTacToe from './TicTacToe'
import Picker, { IOption } from './Picker'

export const App: React.FC = () => {
  const [options, setOptions] = React.useState<IOption[]>([])
  React.useDebugValue(new Date(), date => date.toISOString());
  React.useEffect(() => {
    fetch('https://jsonplaceholder.typicode.com/users')
      .then(response => response.json())
      .then((json: any[]) => {
        const phrases: string[] = json.map<string>(user => user.company.bs
          .split(' ')
          .slice(0,2)
          .join(' '))

        const options = phrases
          .map<IOption>(phrase => ({ name: phrase }))

        setOptions(options)
      })
  }, [])

  const onClickNewOption = () => {
    setOptions(os => [...os, { name: `New Option ${Math.floor(Math.random() * 10)}` } ])
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Tic Tac Toe</h1>
      </header>
      <div className="container">
        <TicTacToe />
      </div>
      <div className="container">
        <Picker
          maxDisplayedOptions={8}
          options={options}
          onClickNewOption={onClickNewOption}
          onSelectOption={o => console.log(`onSelectOption: `, o)}
        />
      </div>
    </div>
  );
}

export default App
