import React, { Component } from 'react';
import './App.css';
import TicTacToe from './TicTacToe'

class App extends Component {
  render() {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Tic Tac Toe</h1>
        </header>
        <div className="container">
          <TicTacToe />
        </div>
      </div>
    );
  }
}

export default App;
