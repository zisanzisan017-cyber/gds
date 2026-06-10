const data = {
    airports: { "DAC": "DHAKA", "ZYL": "SYLHET", "CGP": "CHITTAGONG", "DMM": "DAMMAM", "JED": "JEDDAH", "RUH": "RIYADH", "DXB": "DUBAI", "AUH": "ABU DHABI", "DOH": "DOHA", "LHR": "LONDON", "JFK": "NEW YORK", "SIN": "SINGAPORE", "BKK": "BANGKOK", "KUL": "KUALA LUMPUR", "DEL": "DELHI", "BOM": "MUMBAI", "IST": "ISTANBUL", "CDG": "PARIS", "FRA": "FRANKFURT", "SYD": "SYDNEY" },
    airlines: { "EK": "EMIRATES", "QR": "QATAR AIRWAYS", "BS": "US-BANGLA", "SV": "SAUDIA", "TK": "TURKISH", "BG": "BIMAN BANGLADESH", "AI": "AIR INDIA", "SQ": "SINGAPORE AIR", "EY": "ETIHAD", "GF": "GULF AIR", "KU": "KUWAIT AIR", "WY": "OMAN AIR", "FZ": "FLYDUBAI", "G9": "AIR ARABIA", "UK": "VISTARA", "CX": "CATHAY PACIFIC", "BA": "BRITISH AIRWAYS", "AF": "AIR FRANCE", "LH": "LUFTHANSA", "MH": "MALAYSIA AIR" },
    classes: ["Y", "J", "F", "B", "M", "H", "K", "L", "Q", "T"]
};

let state = {
    isLoggedIn: false,
    lastRoute: { origin: "DAC", dest: "DXB" },
    pnr: { flights: [], names: [], contact: "", ticketing: "", receivedBy: "", payment: "", isSaved: false, isIssued: false, isVoided: false, isRefunded: false, isReissued: false, fareLoaded: false, ticketNumber: "", pnrCode: "", os: [], sr: [], op: "" },
    lastSearch: []
};

function generatePNRCode() { return Math.random().toString(36).substring(2, 8).toUpperCase(); }
function saveToDB(pnr) { localStorage.setItem("last_gds_pnr", JSON.stringify(pnr)); }
function loadFromDB() { const saved = localStorage.getItem("last_gds_pnr"); return saved ? JSON.parse(saved) : null; }

function login() {
    const user = document.getElementById("username").value;
    if (user) {
        state.isLoggedIn = true;
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("terminal-screen").style.display = "flex";
        document.getElementById("command-input").focus();
        printToTerminal("SIGNED IN SUCCESSFULLY AS " + user.toUpperCase());
    } else { alert("Enter Office ID / Username"); }
}

const input = document.getElementById("command-input");
input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        const cmd = this.value.toUpperCase().trim();
        this.value = "";
        processCommand(cmd);
    }
});

function printToTerminal(text, className = "") {
    const output = document.getElementById("output");
    const div = document.createElement("div");
    div.className = className;
    div.textContent = text;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
}

function clearTerminal() {
    document.getElementById("output").innerHTML = "AMADEUS GDS - READY\n--------------------------------------------------";
}

function processCommand(cmd) {
    printToTerminal("> " + cmd);

    if (cmd === "CL") { clearTerminal(); return; }
    
    if (cmd === "IG") {
        saveToDB(state.pnr);
        state.pnr = { flights: [], names: [], contact: "", ticketing: "", receivedBy: "", payment: "", isSaved: false, isIssued: false, isVoided: false, isRefunded: false, isReissued: false, fareLoaded: false, ticketNumber: "", pnrCode: "", os: [], sr: [], op: "" };
        clearTerminal();
        printToTerminal("--- TRANSACTION IGNORED ---");
        return;
    }

    if (cmd === "RT") {
        const saved = loadFromDB();
        if (saved) { state.pnr = saved; printToTerminal("--- PNR RETRIEVED ---"); }
        displayPNR();
        return;
    }

    if (cmd.startsWith("AN")) { handleAN(cmd); return; }
    if (cmd.startsWith("SS")) { handleSS(cmd); return; }
    if (cmd.startsWith("NM")) { handleNM(cmd); return; }
    if (cmd.startsWith("AP")) { handleAP(cmd); return; }
    if (cmd === "TKOK") { state.pnr.ticketing = "OK"; printToTerminal("OK - TICKETING SET"); return; }
    
    if (cmd.startsWith("FP") || cmd.startsWith("FPD")) { 
        state.pnr.payment = cmd.substring(cmd.startsWith("FPD") ? 3 : 2).trim() || "CASH"; 
        printToTerminal("OK - FORM OF PAYMENT ADDED"); 
        return; 
    }
    
    if (cmd.startsWith("OS")) { 
        state.pnr.os.push(cmd.substring(2).trim()); 
        printToTerminal("OK - OS ELEMENT ADDED"); 
        return; 
    }

    if (cmd.startsWith("SR")) { 
        state.pnr.sr.push(cmd.substring(2).trim()); 
        printToTerminal("OK - SR ELEMENT ADDED"); 
        return; 
    }

    if (cmd.startsWith("OP")) { 
        state.pnr.op = cmd.substring(2).trim(); 
        printToTerminal("OK - OPTION ELEMENT ADDED"); 
        return; 
    }

    if (cmd.startsWith("RF")) { state.pnr.receivedBy = cmd.substring(2) || "AGENT"; printToTerminal("OK - RECEIVED BY " + state.pnr.receivedBy); return; }

    if (cmd === "ER") {
        if (state.pnr.flights.length > 0 && state.pnr.names.length > 0) {
            state.pnr.isSaved = true;
            state.pnr.pnrCode = state.pnr.pnrCode || generatePNRCode();
            saveToDB(state.pnr);
            printToTerminal(`--- PNR SAVED: ${state.pnr.pnrCode} ---`);
            displayPNR();
        } else {
            printToTerminal("ERROR: NAMES OR FLIGHTS MISSING. PNR NOT SAVED.", "error");
        }
        return;
    }

    if (cmd === "FXP" || cmd === "FQB") {
        if (state.pnr.flights.length > 0) {
            state.pnr.fareLoaded = true;
            printToTerminal(`FARE QUOTED: USD ${(Math.random()*500+400).toFixed(2)}`);
            printToTerminal("OK - TST CREATED");
        } else {
            printToTerminal("ERROR: NO FLIGHTS IN PNR", "error");
        }
        return;
    }

    if (cmd === "TQT") {
        if (state.pnr.fareLoaded) {
            printToTerminal("--- TST DISPLAY ---");
            printToTerminal("FARE: USD 450.00  TAX: USD 120.00  TOTAL: USD 570.00");
        } else { printToTerminal("ERROR: NO TST STORED", "error"); }
        return;
    }

    if (cmd === "TTP") {
        if (state.pnr.flights.length === 0) { printToTerminal("ERROR: NO FLIGHT SEGMENTS", "error"); return; }
        if (state.pnr.names.length === 0) { printToTerminal("ERROR: NO NAMES IN PNR", "error"); return; }
        if (!state.pnr.isSaved) { printToTerminal("ERROR: PNR NOT SAVED - USE ER", "error"); return; }
        if (!state.pnr.fareLoaded) { printToTerminal("ERROR: FARE NOT LOADED - USE FXP", "error"); return; }
        if (!state.pnr.payment) { printToTerminal("ERROR: PAYMENT MISSING - USE FP", "error"); return; }

        state.pnr.isIssued = true;
        state.pnr.isVoided = false;
        state.pnr.isRefunded = false;
        state.pnr.ticketNumber = "235" + Math.floor(Math.random()*9999999999);
        saveToDB(state.pnr);
        printToTerminal("OK - TICKET ISSUED: " + state.pnr.ticketNumber);
        printToTerminal("PRINTING ELECTRONIC TICKET RECEIPT...");
        setTimeout(() => { printAmadeusTicket(); }, 1000);
        return;
    }

    if (cmd === "TTP/RT") {
        if (state.pnr.isIssued && !state.pnr.isVoided && !state.pnr.isRefunded) {
            state.pnr.isReissued = true;
            state.pnr.ticketNumber = "235" + Math.floor(Math.random()*9999999999);
            saveToDB(state.pnr);
            printToTerminal("--- TICKET RE-ISSUE SUCCESSFUL ---");
            printToTerminal("NEW TICKET: " + state.pnr.ticketNumber);
            setTimeout(() => { printAmadeusTicket(); }, 1000);
        } else {
            printToTerminal("ERROR: RE-ISSUE NOT POSSIBLE (NOT ISSUED OR ALREADY VOID/REFUNDED)", "error");
        }
        return;
    }

    if (cmd === "TRF") {
        if (state.pnr.isIssued && !state.pnr.isVoided && !state.pnr.isRefunded) {
            state.pnr.isRefunded = true;
            saveToDB(state.pnr);
            printToTerminal("--- REFUND PROCESSED SUCCESSFULLY ---");
        } else {
            printToTerminal("ERROR: REFUND NOT POSSIBLE", "error");
        }
        return;
    }

    if (cmd === "TRNC") {
        if (state.pnr.isIssued && !state.pnr.isVoided) {
            state.pnr.isVoided = true;
            saveToDB(state.pnr);
            printToTerminal("--- TICKET VOIDED SUCCESSFULLY ---");
        } else {
            printToTerminal("ERROR: VOID NOT POSSIBLE", "error");
        }
        return;
    }

    if (cmd === "TTR/P" || cmd === "TWD") {
        if (state.pnr.isIssued) { printAmadeusTicket(); }
        else { printToTerminal("ERROR: NO TICKET FOUND", "error"); }
        return;
    }

    if (cmd === "HELP") { printToTerminal("COMMANDS: AN, SS, NM, AP, TKOK, FP, OS, SR, OP, RF, ER, FXP, TQT, TTP, TTP/RT, TRF, TRNC, RT, IG, CL"); return; }

    printToTerminal("INVALID COMMAND", "error");
}

function handleAN(cmd) {
    const match = cmd.match(/AN\s*(\d{2}[A-Z]{3})\s*([A-Z]{3})\s*([A-Z]{3})/);
    if (!match) { printToTerminal("FORMAT: AN 25JUN DACDXB", "error"); return; }
    const date = match[1], origin = match[2], dest = match[3];
    state.lastRoute = { origin, dest };
    printToTerminal(`** AVAILABILITY ** ${origin}/${dest} - ${date}`);
    state.lastSearch = [];
    for (let i = 1; i <= 3; i++) {
        const flight = { id: i, airline: "EK", flightNum: "EK" + (580+i), origin, dest, date, depTime: "1440", arrTime: "1840", classes: ["Y9", "J9", "F9"] };
        state.lastSearch.push(flight);
        printToTerminal(`${i}  ${flight.flightNum}  ${flight.classes.join(" ")}  ${origin}${dest}  1440  1840`);
    }
}

function handleSS(cmd) {
    const match = cmd.match(/SS(\d)([A-Z])(\d)/);
    if (match && state.lastSearch[match[3]-1]) {
        const flight = state.lastSearch[match[3]-1];
        state.pnr.flights.push({ ...flight, selectedClass: match[2], seats: match[1] });
        printToTerminal(`OK - SELECTED ${flight.flightNum}`);
    } else {
        printToTerminal("ERROR: USE AN FIRST TO SEARCH FLIGHTS", "error");
    }
}

function handleNM(cmd) { const name = cmd.substring(2); if (name) { state.pnr.names.push(name); printToTerminal(`OK - NAME ADDED`); } }
function handleAP(cmd) { state.pnr.contact = cmd.substring(2); printToTerminal("OK - CONTACT ADDED"); }

function displayPNR() {
    printToTerminal("--- PNR DISPLAY ---");
    if (state.pnr.pnrCode) printToTerminal(`RP/DAC1A0980/123456  ${state.pnr.pnrCode}`);
    state.pnr.names.forEach((n, i) => printToTerminal(`${i+1}. ${n}`));
    state.pnr.flights.forEach((f, i) => printToTerminal(`${i+1}  ${f.flightNum} ${f.selectedClass} ${f.date} ${f.origin}${f.dest} HK${f.seats}`));
    state.pnr.os.forEach((os, i) => printToTerminal(`OS ${os}`));
    state.pnr.sr.forEach((sr, i) => printToTerminal(`SR ${sr}`));
    if (state.pnr.op) printToTerminal(`OP ${state.pnr.op}`);
    
    let status = "OK";
    if (state.pnr.isVoided) status = "VOIDED";
    if (state.pnr.isRefunded) status = "REFUNDED";
    if (state.pnr.isReissued) status = "RE-ISSUED";
    
    if (state.pnr.isIssued) printToTerminal(`TKT: ${state.pnr.ticketNumber} (${status})`);
}

function printAmadeusTicket() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pnr = state.pnr;
    const issueDate = new Date().toLocaleDateString();
    
    let ticketStatus = "CONFIRMED";
    if (pnr.isVoided) ticketStatus = "VOIDED";
    if (pnr.isRefunded) ticketStatus = "REFUNDED";
    if (pnr.isReissued) ticketStatus = "RE-ISSUED";

    doc.setFont("courier", "bold");
    doc.setFontSize(16);
    doc.text("AMADEUS GDS - ELECTRONIC TICKET RECEIPT", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("courier", "normal");
    doc.text("-------------------------------------------------------------------------", 15, 25);
    
    doc.text(`BOOKING REFERENCE (PNR): ${pnr.pnrCode || "X7Y2Z9"}`, 15, 35);
    doc.text(`DATE OF ISSUE: ${issueDate}`, 120, 35);
    doc.text(`ISSUING AGENT: AMADEUS GDS SIMULATOR / DAC`, 15, 42);
    doc.text(`TICKET NUMBER: ${pnr.ticketNumber || "2350000000000"}`, 15, 49);
    doc.text(`TICKET STATUS: ${ticketStatus}`, 15, 56);

    doc.text("-------------------------------------------------------------------------", 15, 62);
    
    doc.setFont("courier", "bold");
    doc.text("PASSENGER DETAILS:", 15, 72);
    doc.setFont("courier", "normal");
    doc.text(`NAME: ${pnr.names[0] || "ALI/ATIK MR"}`, 15, 79);

    doc.text("-------------------------------------------------------------------------", 15, 86);

    doc.setFont("courier", "bold");
    doc.text("FLIGHT ITINERARY:", 15, 96);
    doc.setFont("courier", "normal");
    
    let y = 106;
    if (pnr.flights.length > 0) {
        pnr.flights.forEach(f => {
            doc.text(`${f.flightNum}  ${f.selectedClass}  ${f.date}  ${f.origin}-${f.dest}  CONFIRMED`, 15, y);
            doc.text(`DEPARTURE: 14:40  ARRIVAL: 18:40  BAGS: 30KG`, 15, y+7);
            y += 15;
        });
    }

    doc.text("-------------------------------------------------------------------------", 15, y+5);

    doc.setFont("courier", "bold");
    doc.text("FARE CALCULATION:", 15, y+15);
    doc.setFont("courier", "normal");
    doc.text("FARE      : USD 450.00", 15, y+22);
    doc.text("TAXES     : USD 120.00", 15, y+29);
    doc.text("TOTAL     : USD 570.00", 15, y+36);
    doc.text(`PAYMENT   : ${pnr.payment || "CASH"}`, 15, y+43);

    doc.text("-------------------------------------------------------------------------", 15, y+50);

    doc.setFontSize(8);
    doc.text("NOTICE: CARRIAGE AND OTHER SERVICES PROVIDED BY THE CARRIER ARE SUBJECT", 15, y+60);
    doc.text("TO CONDITIONS OF CARRIAGE, WHICH ARE HEREBY INCORPORATED BY REFERENCE.", 15, y+65);
    doc.text("THANK YOU FOR USING AMADEUS GDS SIMULATOR.", 15, y+75);

    const fileName = `ETICKET_AMADEUS_${pnr.pnrCode || "DRAFT"}.pdf`;
    doc.save(fileName);
    printToTerminal(`OK - ${fileName} DOWNLOADED`);
}
