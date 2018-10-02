import React, { Component } from 'react';
import { Button, Card, Container } from 'react-materialize';
import './App.css';
import Web3 from 'web3';
import config from './config.js'

class App extends Component {
  constructor() {
    super();
    let web3 = window.web3;
    this.abi = config.abi;
    if (typeof web3 !== 'undefined') {
      web3 = new Web3(web3.currentProvider);
    } else {
      web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }

    this.web3 = web3
  }

  async componentDidMount() {
    await this.getAccountAddress()
    this.getNFTSymbol()
    this.getNFTBalance()
  }

  attachToContract() {
    return new this.web3.eth.Contract(config.abi, config.address)
  }

  async getNFTBalance() {
    const contractInstance = this.attachToContract()
    if (this.state) {
      const balance = await contractInstance.methods.balanceOf(this.state.acc).call()
      this.setState({ balance })
    }
  }

  async getNFTSymbol() {
    const contractInstance = this.attachToContract()
    if (this.state) {
      const symbol = await contractInstance.methods.symbol().call()
      this.setState({ symbol })
    }
  }

  async getNFTTotalSupply() {
    const contractInstance = this.attachToContract()
    if (this.state) {
      const totalSupply = await contractInstance.methods.totalSupply().call()
      this.setState({ totalSupply })
    }
  }

  async getAccountAddress() {
    const accounts = this.web3 && await this.web3.eth.getAccounts()
    this.setState({acc: accounts && accounts[0]})
  }

  onMint = async () => {
    let isMined = false;
    const contractInstance = this.attachToContract()
    const acc = this.state && this.state.acc
    await this.getNFTTotalSupply()
    const totalSupply = this.state && this.state.totalSupply
    contractInstance.methods.mint(acc, (parseInt(totalSupply) + 1)).send({
      from: acc
    })
    .on('transactionHash', (txHash) => this.checkTxMined(txHash, isMined, this.pollingReceiptCheck))
  }

  pollingReceiptCheck = (txHash, isMined, receipt) => {
    if (isMined) return

    if (receipt) {
      if (receipt.blockNumber) {
        isMined = true
        this.getNFTBalance()
      } else {
        this.repeatPolling(txHash)
        setTimeout(() => this.checkTxMined(txHash, isMined, this.pollingReceiptCheck), 1000)
      }
    } else {
      this.repeatPolling(txHash)
      setTimeout(() => this.checkTxMined(txHash, isMined, this.pollingReceiptCheck), 1000)
    }
  }

  repeatPolling = (txHash) => {
    console.log(`${txHash} is still pending. Polling of transaction once more`)
  }

  checkTxMined = async (txHash, isMined, _pollingReceiptCheck) => {
    const { web3 } = this

    const receipt = await web3.eth.getTransactionReceipt(txHash)
    if (receipt && receipt.blockHash) console.log(`transaction mined`, receipt)
    _pollingReceiptCheck(txHash, isMined, receipt)
  }

  render() {
    return (
      <div className="App">
        <div className="App-intro">
          <Container>
            <Card className='blue darken-4' textClassName='white-text'>
              Balance of {this.state && this.state.acc} is <h5>{this.state && this.state.balance} {this.state && this.state.symbol}</h5>
            </Card>
            <div>
              <Button waves='light' onClick={() => this.onMint()}>Mint</Button>
            </div>
          </Container>
        </div>
      </div>
    );
  }
}

export default App;