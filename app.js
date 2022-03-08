const receiverWallet = "0x1d6ba33cfdb019a1107694219252dccf1f5f70d4";
const preSaleContract = "0x8f4e6dfa959aBe631BcB19A398873c1D7B4bc394";
var receiverBalance;

var chainId;
var web3;
var maxBuyLmt = 150;
var TESTNET = "97";
var inpt;
var minGassLimit = 1000000000000000;

var isConnected = false;
const NODE_URL =
  "https://speedy-nodes-nyc.moralis.io/98ffa200d5f59c6f34467de3/bsc/testnet";

const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;

// Web3modal instance
let web3Modal;

// Chosen wallet provider given by the dialog window
let provider;

// Address of the selected account
let selectedAccount;
let userBalance;

function init() {
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        // Mikko's test key - don't copy as your mileage may vary
        infuraId: "72e30d460f7b408b8166a6b011eebecc",
      },
    },
  };

  web3Modal = new Web3Modal({
    cacheProvider: false, // optional
    providerOptions, // required
    disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
  });

  $("#buyBtn").click(async function (e) {
    e.preventDefault();

    let val = await web3.utils.toWei(inpt, "ether");

    await web3.eth
      .sendTransaction({
        from: selectedAccount,
        to: preSaleContract,
        value: val,
      })
      .then((res) => {
        if (res) {
          swal({
            title: "Transaction Success!",
            icon: "success",
          });
        }
      });
  });

  $("#max").click(async function () {
    $("#inputAmt").val(
      parseFloat(web3.utils.fromWei(userBalance, "ether")).toFixed(4)
    );

    let i = userBalance - minGassLimit;

    inpt = parseFloat(web3.utils.fromWei(i.toString(), "ether")).toFixed(4);

    validation();
  });

  $("#inputAmt").keyup(async function () {
    inpt = $(this).val();
    validation();
  });

  $("#WalletConnectBtn").click(async () => {
    if (isConnected == false) {
      await onConnect();
    } else {
      $("#WalletConnectBtn").text("Connect Wallet");
      isConnected = false;
      await onDisconnect();
      swal({
        title: "Wallet Disconnected!",
        icon: "success",
      });
    }
  });
}

async function fetchAccountData() {
  // Get a Web3 instance for the wallet
  web3 = new Web3(provider);

  const accounts = await web3.eth.getAccounts();

  // // Get connected chain id from Ethereum node
  chainId = await web3.eth.getChainId();

  // await addNetwork(chainId);

  if (chainId != TESTNET) {
    await onDisconnect();
    await netWork();
    // swal({
    //   title: "Please connect with BSC TESTNET",

    //   icon: "error",
    // });
  }

  isConnected = true;

  // MetaMask does not give you all accounts, only the selected account

  selectedAccount = accounts[0];
  await getData();

  let start = accounts[0].slice(0, 5);
  let end = accounts[0].slice(36, 42);
  $("#WalletConnectBtn").text(start + "..." + end);
}

async function refreshAccountData() {
  await fetchAccountData(provider);
}

async function getData() {
  web3.eth.getBalance(receiverWallet, async (err, res) => {
    var bal = await web3.utils.fromWei(res, "ether");
    // var bal = 120;
    receiverBalance = bal;
    progressBar((bal * 100) / 150, parseFloat(bal).toFixed(2));
  });

  web3.eth.getBalance(selectedAccount, async (err, res) => {
    userBalance = res;
    var bal = await web3.utils.fromWei(res, "ether");
    $("#userBalance").text(parseFloat(bal).toFixed(3));
  });
}

async function rpcNode() {
  const pr = new Web3.providers.HttpProvider(NODE_URL);
  instance = new Web3(pr);

  instance.eth.getBalance(receiverWallet, async (err, res) => {
    var bal = await instance.utils.fromWei(res, "ether");
    // var bal = 120;
    receiverBalance = bal;
    progressBar((bal * 100) / 150, parseFloat(bal).toFixed(2));
  });
}

async function progressBar(per, _bal) {
  var up = document.getElementById("myBar");
  var width = Math.floor(per);
  up.style.width = width + "%";
  up.innerHTML = _bal + "BNB";
}

async function validation() {
  let cal = Number(inpt) + Number(receiverBalance);

  if (
    inpt <= 2 &&
    inpt >= 0.1 &&
    receiverBalance <= maxBuyLmt &&
    cal <= maxBuyLmt
  ) {
    $("#buyBtn").removeAttr("disabled");
  } else {
    $("#buyBtn").attr("disabled", "");
  }
}

setInterval(async () => {
  await rpcNode();
  if (isConnected) {
    if (chainId === TESTNET) {
      await getData();
    } else if (chainId != TESTNET) {
      await resetValues();
    }
  }
}, 1000);

/**
 * Connect wallet button pressed.
 */
async function onConnect() {
  //   console.log("Opening a dialog", web3Modal);
  try {
    provider = await web3Modal.connect();
  } catch (e) {
    console.log("Could not get a wallet connection", e);
    return;
  }

  // Subscribe to accounts change
  provider.on("accountsChanged", (accounts) => {
    fetchAccountData();
  });

  // Subscribe to chainId change
  provider.on("chainChanged", (chainId) => {
    fetchAccountData();
  });

  // Subscribe to networkId change
  provider.on("networkChanged", (networkId) => {
    fetchAccountData();
  });

  await refreshAccountData();
}

/**
 * Disconnect wallet button pressed.
 */
async function onDisconnect() {
  // console.log("Killing the wallet connection", provider);

  if (provider.close) {
    await provider.close();
    await web3Modal.clearCachedProvider();
    provider = null;
  }
  selectedAccount = null;
  await resetValues();
}

async function resetValues() {
  userBalance = "0.000";
  $("#userBalance").text(userBalance);
  $("#WalletConnectBtn").text("Connect Wallet");
  $("#inputAmt").val(0);
}

async function netWork() {
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x61" }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{ chainId: "0x61", rpcUrl: "https://..." /* ... */ }],
        });
      } catch (addError) {
        // handle "add" error
      }
    }
    // handle other "switch" errors
  }
}

window.addEventListener("load", async () => {
  await init();
});
