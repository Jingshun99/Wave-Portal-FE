import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import {Circles} from 'react-loader-spinner';
import abi from "./utils/WavePortal.json";


const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [mining, setMining] = useState(false)
  const [done, setMined] = useState(false)
  const [text, onChangeText] = useState("");
  const [allWaves, setAllWaves]  = useState([]);
  const contractAddress = "0x1e6A243e2E7f36fCf1B7728041220cd452B52346";
  const contractABI = abi.abi;
  
  const checkIfWalletIsConnected = async () => {
    try{
    const { ethereum } = window;

    if(!ethereum) {
      console.log("Make sure you have metamask!");
    } else {
      console.log("We have the ethereum object", ethereum);
    }

  const accounts = await ethereum.request({ method: "eth_accounts"});

  if (accounts.length !== 0) {
    const account = accounts[0];
    console.log("Found an authorized account:", account);
    setCurrentAccount(account)
    getAllWaves();
  } else {
    console.log("No authorized account found")
  }
  } catch (error) {
      console.log(error);
  }
  }

  const displayCount = async () => {
    try{
      const { ethereum } = window;

    if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        document.getElementById('count').innerHTML = count;
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }
  
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get Metamask!");
        return;
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts"});

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error){
      console.log(error)
    }
  }

  const wave = async (message) => {
    try {
      onChangeText("");
      setMined(false);
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        const waveTxn = await wavePortalContract.wave(message,{ gasLimit: 300000});
        console.log("Mining...", waveTxn.hash);
        setMining(true);
        await waveTxn.wait();
        console.log("Mined --", waveTxn.hash);
        setMining(false);
        setMined(true);
        
        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        document.getElementById('count').innerHTML = count;
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const getAllWaves = async () => {
    const { ethereum } = window;
    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp*1000),
            message: wave.message
          });
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist")
      }     
    }  catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [...prevState,{
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message,
      }]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave",onNewWave);
    }

    return () => {
      if (wavePortalContract){
        wavePortalContract.off("NewWave", onNewWave);
      }
    }
  }, []);

  
  useEffect(() => {
    checkIfWalletIsConnected();
  },[])

  useEffect(() => {
    displayCount();
  },[])

  return (

    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
        👋 What's up!
        </div>

        <div className="bio">
        Welcome to my ugly-looking Wave Portal! Connect your Ethereum wallet and wave at me!
        </div>
        <input
          id="msg"
          type="text"
          value={text}
          onChange={(e)=>onChangeText(e.currentTarget.value)}
          />
        <button className="waveButton" onClick={()=>wave(document.getElementById('msg').value)}>
          Wave at Me
        </button>
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        {currentAccount && (
          <div className="count">
            Total waves received: <span id="count"></span>
          </div>
        )}
        {currentAccount && mining &&(
        <div>
          <Circles className='loading' color="#00BFFF" height={40} width={600} />
        </div>
      )}
        {currentAccount && mining &&(
        <div className="count">
          Mining...
        </div>
      )}
        {currentAccount && done &&(
        <div className="count">
          Mined!
        </div>
      )}
        {currentAccount && allWaves.map((wave, index) =>{
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop:"16px",padding:"8px"}}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}

export default App