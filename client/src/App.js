import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Landing from './components/layout/Landing'
const App = () => (
  <Router>
    <>
      <Navbar />
      <Route exact path='/' component={Landing} />
    </>
  </Router>
)
export default App;
