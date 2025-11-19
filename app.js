// app.js - FestChain starter (offline Ganache + Web3.js)
// Make sure Ganache is running at http://127.0.0.1:7545
// 1) Deploy FestManager.sol from Remix to Ganache (Web3 Provider -> http://127.0.0.1:7545)
// 2) Copy deployed contract address and paste into contractAddress below
// 3) Copy the ABI JSON (from Remix Compile -> ABI) and paste into contractABI (or use abi.json)

// --- CONFIGURE THIS ---
const contractAddress = "PASTE_YOUR_CONTRACT_ADDRESS_HERE"; // <-- replace after deployment

const contractABI = /* PASTE THE ABI JSON HERE (the block above) */ [];

// ---------------------------------------

const web3 = new Web3("http://127.0.0.1:7545"); // connect to Ganache
let contract;
let accounts = [];
let currentAccountIndex = 0; // you can change to simulate different users

async function init() {
  try {
    accounts = await web3.eth.getAccounts();
    console.log("Ganache accounts:", accounts);
    if (accounts.length === 0) {
      throw new Error("No accounts found. Is Ganache running?");
    }

    // set default account (admin by default is account[0] if you deployed from account[0])
    currentAccountIndex = 0;
    contract = new web3.eth.Contract(contractABI, contractAddress);

    // UI hook example: show which account we're using
    console.log("Using account:", accounts[currentAccountIndex]);
    // If you have DOM elements, you can show this in the page:
    // document.getElementById('accountInfo').innerText = accounts[currentAccountIndex];

    // load events to display
    await loadEvents();
  } catch (err) {
    console.error("Init error:", err.message || err);
  }
}

// Utility to switch the active account (for demo/testing)
// Call setActiveAccount(1) to use account index 1, etc.
function setActiveAccount(index) {
  if (!accounts || index < 0 || index >= accounts.length) {
    console.error("Invalid account index");
    return;
  }
  currentAccountIndex = index;
  console.log("Active account set to:", accounts[currentAccountIndex]);
  // update UI if needed
}

// Load all events and print to console (or render to DOM)
async function loadEvents() {
  try {
    const count = await contract.methods.eventCount().call();
    console.log("Total events:", count);

    // if you have a DOM element #eventsList, clear it first
    if (document.getElementById("eventsList")) {
      document.getElementById("eventsList").innerHTML = "";
    }

    for (let i = 0; i < count; i++) {
      const e = await contract.methods.getEvent(i).call();
      // e is [title, date, capacity, registeredCount, voteCount, active]
      const eventObj = {
        id: i,
        title: e[0],
        date: e[1],
        capacity: parseInt(e[2]),
        registeredCount: parseInt(e[3]),
        voteCount: parseInt(e[4]),
        active: e[5]
      };
      console.log("Event:", eventObj);

      // Example DOM rendering (if index.html has #eventsList)
      if (document.getElementById("eventsList")) {
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
          <b>${eventObj.title}</b> <br>
          Date: ${eventObj.date} <br>
          Capacity: ${eventObj.registeredCount}/${eventObj.capacity} <br>
          Votes: ${eventObj.voteCount} <br>
          <button onclick="registerForEvent(${i})">Register</button>
          <button onclick="voteFor(${i})">Vote</button>
        `;
        document.getElementById("eventsList").appendChild(div);
      }
    }
  } catch (err) {
    console.error("loadEvents error:", err.message || err);
  }
}

// Admin function: create an event (call from account that is admin)
async function createEvent(title, date, capacity) {
  try {
    const from = accounts[currentAccountIndex];
    console.log("Creating event from", from);
    await contract.methods.createEvent(title, date, capacity).send({ from });
    console.log("Event created!");
    await loadEvents();
  } catch (err) {
    console.error("createEvent error:", err && err.message ? err.message : err);
  }
}

// Register current account for an event
async function registerForEvent(eventId) {
  try {
    const from = accounts[currentAccountIndex];
    console.log(`Registering account ${from} for event ${eventId}`);
    await contract.methods.registerForEvent(eventId).send({ from });
    console.log("Registered!");
    await loadEvents();
  } catch (err) {
    console.error("registerForEvent error:", err && err.message ? err.message : err);
  }
}

// Vote for an event from current account
async function voteFor(eventId) {
  try {
    const from = accounts[currentAccountIndex];
    console.log(`Voting from ${from} for event ${eventId}`);
    await contract.methods.vote(eventId).send({ from });
    console.log("Voted!");
    await loadEvents();
  } catch (err) {
    console.error("voteFor error:", err && err.message ? err.message : err);
  }
}

// Admin: mark a particular attendee present for an event
async function markPresent(eventId, attendeeAddress) {
  try {
    const from = accounts[currentAccountIndex];
    console.log(`Marking present ${attendeeAddress} at event ${eventId} from admin ${from}`);
    await contract.methods.markPresent(eventId, attendeeAddress).send({ from });
    console.log("Marked present!");
    await loadEvents();
  } catch (err) {
    console.error("markPresent error:", err && err.message ? err.message : err);
  }
}

// Simple demo helper to show how to simulate flows:
// 1) setActiveAccount(0) // admin (deployer account usually 0)
// 2) createEvent("Rock Night","Nov 25 6pm",50)
// 3) setActiveAccount(1) // attendee
// 4) registerForEvent(0)
// 5) voteFor(0)
// 6) setActiveAccount(0) // admin
// 7) markPresent(0, accounts[1])

// Initialize on page load
window.addEventListener('load', init);