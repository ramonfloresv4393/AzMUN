import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { MUNData, School, Committee, Country, Delegate, Payment, SystemConfig, AdminUser } from "./src/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "data-mun.json");

app.use(express.json());

// Initial mock data if database does not exist
const initialConfig: SystemConfig = {
  registrationEnabled: true,
  numPaymentsRequired: 2,
  paymentAmount: 300,
  totalAmountToPay: 600,
  currentReceiptFolio: 1001,
};

const initialSchools: School[] = [
  { id: "sch-1", name: "Colegio de Bachilleres - Villa de Seris", username: "vseris", passwordHash: "mun2026", maxQuota: 8, roomsMale: 2, roomsFemale: 2 },
  { id: "sch-2", name: "Colegio de Bachilleres - Reforma", username: "reforma", passwordHash: "mun2026", maxQuota: 6, roomsMale: 1, roomsFemale: 2 },
  { id: "sch-3", name: "PrepaTec Hermosillo", username: "ptec", passwordHash: "mun2026", maxQuota: 5, roomsMale: 1, roomsFemale: 1 },
  { id: "sch-4", name: "Instituto Vanguardia", username: "vanguardia", passwordHash: "mun2026", maxQuota: 4, roomsMale: 1, roomsFemale: 1 }
];

const initialCommittees: Committee[] = [
  { id: "com-1", name: "UNSC (Consejo de Seguridad)", doubleDelegation: true, countries: ["cou-1", "cou-2", "cou-3", "cou-4", "cou-5", "cou-6", "cou-7"], language: "Inglés" },
  { id: "com-2", name: "UNICEF (Fondo de Infancia)", doubleDelegation: false, countries: ["cou-1", "cou-2", "cou-3", "cou-6", "cou-8", "cou-9", "cou-10"], language: "Español" },
  { id: "com-3", name: "DIASEC (Desarme y Seguridad)", doubleDelegation: true, countries: ["cou-1", "cou-2", "cou-4", "cou-5", "cou-11", "cou-12", "cou-13"], language: "Bilingüe" },
  { id: "com-4", name: "OMS (Salud Mundial)", doubleDelegation: false, countries: ["cou-1", "cou-6", "cou-7", "cou-8", "cou-10", "cou-14", "cou-15"], language: "Español" }
];

const initialCountries: Country[] = [
  { id: "cou-1", name: "Estados Unidos" },
  { id: "cou-2", name: "China" },
  { id: "cou-3", name: "Federación de Rusia" },
  { id: "cou-4", name: "Reino Unido" },
  { id: "cou-5", name: "Francia" },
  { id: "cou-6", name: "México" },
  { id: "cou-7", name: "Japón" },
  { id: "cou-8", name: "Alemania" },
  { id: "cou-9", name: "Brasil" },
  { id: "cou-10", name: "Canadá" },
  { id: "cou-11", name: "Sudáfrica" },
  { id: "cou-12", name: "India" },
  { id: "cou-13", name: "Arabia Saudita" },
  { id: "cou-14", name: "Australia" },
  { id: "cou-15", name: "Corea del Sur" }
];

const initialDelegates: Delegate[] = [
  {
    id: "del-1",
    names: "Sofía",
    lastNames: "López Gaxiola",
    phone: "6621456789",
    schoolId: "sch-1",
    email: "sofia.lopez@bachilleresdesonora.edu.mx",
    choices: ["com-1", "com-2", "com-3"],
    assignedCommitteeId: "com-1",
    assignedCountryId: "cou-6",
    status: "selected",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    language: "Español",
    sex: "Mujer",
    shirtSize: "M",
    roomNumber: 1
  },
  {
    id: "del-2",
    names: "Carlos Mateo",
    lastNames: "Valenzuela Ruiz",
    phone: "6622874112",
    schoolId: "sch-1",
    email: "carlos.valenzuela@bachilleresdesonora.edu.mx",
    choices: ["com-2", "com-4", "com-1"],
    assignedCommitteeId: "com-2",
    assignedCountryId: "cou-1",
    status: "selected",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    language: "Español",
    sex: "Hombre",
    shirtSize: "L",
    roomNumber: 1
  },
  {
    id: "del-3",
    names: "Regina",
    lastNames: "Domínguez Ochoa",
    phone: "6623991200",
    schoolId: "sch-1",
    email: "regina.dominguez@bachilleresdesonora.edu.mx",
    choices: ["com-3", "com-1", "com-4"],
    assignedCommitteeId: null,
    assignedCountryId: null,
    status: "pending",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    language: "Bilingüe",
    sex: "Mujer",
    shirtSize: "S",
    roomNumber: null
  },
  {
    id: "del-4",
    names: "José Eduardo",
    lastNames: "Ortega Mendívil",
    phone: "6624551122",
    schoolId: "sch-2",
    email: "eduardo.ortega@bachilleresdesonora.edu.mx",
    choices: ["com-1", "com-3", "com-4"],
    assignedCommitteeId: "com-1",
    assignedCountryId: "cou-2",
    status: "selected",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    language: "Inglés",
    sex: "Hombre",
    shirtSize: "XL",
    roomNumber: 1
  },
  {
    id: "del-5",
    names: "Ana Paulina",
    lastNames: "Romero Castro",
    phone: "6621112233",
    schoolId: "sch-2",
    email: "paulina.romero@bachilleresdesonora.edu.mx",
    choices: ["com-4", "com-2", "com-3"],
    assignedCommitteeId: null,
    assignedCountryId: null,
    status: "pending",
    createdAt: new Date().toISOString(),
    language: "Español",
    sex: "Mujer",
    shirtSize: "M",
    roomNumber: null
  }
];

const initialPayments: Payment[] = [
  {
    id: "pay-1",
    folio: 1001,
    studentId: "del-1",
    amount: 300,
    paymentIndex: 1,
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "Primer pago de inscripción"
  },
  {
    id: "pay-2",
    folio: 1002,
    studentId: "del-1",
    amount: 300,
    paymentIndex: 2,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "Segundo pago y liquidación"
  },
  {
    id: "pay-3",
    folio: 1003,
    studentId: "del-2",
    amount: 300,
    paymentIndex: 1,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "Primer pago - transferencia bancaria"
  },
  {
    id: "pay-4",
    folio: 1004,
    studentId: "del-4",
    amount: 300,
    paymentIndex: 1,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "Pago recibido en efectivo"
  }
];

const initialAdminUsers: AdminUser[] = [
  { id: "adm-1", name: "Organizador Principal", username: "admin", passwordHash: "mun2026", role: "superadmin" },
  { id: "adm-2", name: "Coordinación Registro", username: "registro", passwordHash: "mun2026", role: "coordinator" },
  { id: "adm-3", name: "Coordinación Finanzas", username: "finanzas", passwordHash: "mun2026", role: "finance" }
];

const initialCycles = [
  { id: "cycle-2000", name: "Ciclo Escolar 2000", isActive: true },
  { id: "cycle-2026", name: "Ciclo Escolar 2026", isActive: false }
];

const initialData: MUNData = {
  schools: initialSchools.map(s => ({ ...s, cycleId: "cycle-2000" })),
  committees: initialCommittees.map(c => ({ ...c, cycleId: "cycle-2000" })),
  countries: initialCountries.map(co => ({ ...co, cycleId: "cycle-2000" })),
  delegates: initialDelegates.map(d => ({ ...d, cycleId: "cycle-2000" })),
  payments: initialPayments.map(p => ({ ...p, cycleId: "cycle-2000" })),
  adminUsers: initialAdminUsers,
  cycles: initialCycles,
  activeCycleId: "cycle-2000",
  config: {
    ...initialConfig,
    currentReceiptFolio: 1005,
    cycleId: "cycle-2000"
  },
  configs: [
    {
      ...initialConfig,
      currentReceiptFolio: 1005,
      cycleId: "cycle-2000"
    }
  ]
};

// Helper to read database
function readDB(): MUNData {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
      return initialData;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as MUNData;
    
    // BACKWARD COMPATIBILITY MIGRATE
    let altered = false;
    if (!parsed.adminUsers) {
      parsed.adminUsers = initialAdminUsers;
      altered = true;
    }
    if (!parsed.schools) parsed.schools = [];
    parsed.schools.forEach(s => {
      if (s.roomsMale === undefined) {
        s.roomsMale = 0;
        altered = true;
      }
      if (s.roomsFemale === undefined) {
        s.roomsFemale = 0;
        altered = true;
      }
    });
    parsed.committees.forEach(c => {
      if (c.doubleDelegation === undefined) {
        c.doubleDelegation = false;
        altered = true;
      }
      if (!c.countries) {
        c.countries = parsed.countries.map(cou => cou.id);
        altered = true;
      }
      if (!c.language) {
        c.language = "Español";
        altered = true;
      }
    });
    if (!parsed.delegates) parsed.delegates = [];
    parsed.delegates.forEach(d => {
      if (!d.language) {
        d.language = "Español";
        altered = true;
      }
      if (!d.sex) {
        const femaleNames = ["sofía", "sofia", "regina", "ana", "paulina", "maria", "maría", "lucia", "lucía", "gabriela", "laura", "carla"];
        const first = d.names.toLowerCase();
        const isFemale = femaleNames.some(fn => first.includes(fn));
        d.sex = isFemale ? "Mujer" : "Hombre";
        altered = true;
      }
      if (!d.shirtSize) {
        d.shirtSize = "M";
        altered = true;
      }
      if (d.roomNumber === undefined) {
        d.roomNumber = null;
        altered = true;
      }
    });

    // Migrate to school cycles
    if (!parsed.cycles || parsed.cycles.length === 0) {
      parsed.cycles = [
        { id: "cycle-2000", name: "Ciclo Escolar 2000", isActive: true },
        { id: "cycle-2026", name: "Ciclo Escolar 2026", isActive: false }
      ];
      parsed.activeCycleId = "cycle-2000";
      altered = true;
    }
    if (!parsed.activeCycleId) {
      parsed.activeCycleId = "cycle-2000";
      altered = true;
    }
    if (!parsed.configs) {
      parsed.configs = [
        {
          ...parsed.config,
          cycleId: "cycle-2000"
        }
      ];
      altered = true;
    }

    parsed.configs.forEach(cfg => {
      if (cfg.totalAmountToPay === undefined) {
        cfg.totalAmountToPay = (cfg.numPaymentsRequired || 2) * (cfg.paymentAmount || 300);
        altered = true;
      }
    });

    if (parsed.config && parsed.config.totalAmountToPay === undefined) {
      parsed.config.totalAmountToPay = (parsed.config.numPaymentsRequired || 2) * (parsed.config.paymentAmount || 300);
      altered = true;
    }

    parsed.schools.forEach(s => {
      if (!s.cycleId) {
        s.cycleId = "cycle-2000";
        altered = true;
      }
    });
    parsed.committees.forEach(c => {
      if (!c.cycleId) {
        c.cycleId = "cycle-2000";
        altered = true;
      }
    });
    parsed.countries.forEach(co => {
      if (!co.cycleId) {
        co.cycleId = "cycle-2000";
        altered = true;
      }
    });
    parsed.delegates.forEach(d => {
      if (!d.cycleId) {
        d.cycleId = "cycle-2000";
        altered = true;
      }
    });
    parsed.payments.forEach(p => {
      if (!p.cycleId) {
        p.cycleId = "cycle-2000";
        altered = true;
      }
    });
    
    if (altered) {
      writeDB(parsed);
    }
    return parsed;
  } catch (err) {
    console.error("Error reading db, returning initialData:", err);
    return initialData;
  }
}

// Helper to write database
function writeDB(data: MUNData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing db:", err);
  }
}

// Ensure database file exists upon startup
readDB();

// --- API ENDPOINTS ---

// GET full data
app.get("/api/mun", (req, res) => {
  const db = readDB();
  const activeCycleId = db.activeCycleId || "cycle-2000";

  // Find active config
  if (!db.configs) db.configs = [];
  let activeConfig = db.configs.find(cfg => cfg.cycleId === activeCycleId);
  if (!activeConfig) {
    activeConfig = {
      ...initialConfig,
      cycleId: activeCycleId
    };
    db.configs.push(activeConfig);
    db.config = { ...activeConfig };
    writeDB(db);
  }

  // Filter lists by active cycle
  const filteredSchools = db.schools.filter(s => s.cycleId === activeCycleId);
  const filteredCommittees = db.committees.filter(c => c.cycleId === activeCycleId);
  const filteredCountries = db.countries.filter(c => c.cycleId === activeCycleId);
  const filteredDelegates = db.delegates.filter(d => d.cycleId === activeCycleId);
  const filteredPayments = db.payments.filter(p => p.cycleId === activeCycleId);

  res.json({
    schools: filteredSchools,
    committees: filteredCommittees,
    countries: filteredCountries,
    delegates: filteredDelegates,
    payments: filteredPayments,
    config: activeConfig,
    adminUsers: db.adminUsers || [],
    cycles: db.cycles || [],
    activeCycleId: activeCycleId
  });
});

// POST update general configuration
app.post("/api/config", (req, res) => {
  const db = readDB();
  const activeCycleId = db.activeCycleId || "cycle-2000";
  const { registrationEnabled, numPaymentsRequired, paymentAmount, totalAmountToPay } = req.body;
  
  if (!db.configs) db.configs = [];
  let activeConfig = db.configs.find(cfg => cfg.cycleId === activeCycleId);
  if (!activeConfig) {
    activeConfig = {
      ...initialConfig,
      cycleId: activeCycleId
    };
    db.configs.push(activeConfig);
  }

  activeConfig.registrationEnabled = !!registrationEnabled;
  if (typeof numPaymentsRequired === "number") activeConfig.numPaymentsRequired = numPaymentsRequired;
  if (typeof paymentAmount === "number") activeConfig.paymentAmount = paymentAmount;
  if (typeof totalAmountToPay === "number") activeConfig.totalAmountToPay = totalAmountToPay;
  
  // Also update global root config for backwards-compatibility
  db.config = { ...activeConfig };
  
  writeDB(db);
  res.json({ success: true, config: activeConfig });
});

// POST register delegate (Student self-registration)
app.post("/api/register-delegate", (req, res) => {
  const db = readDB();
  const activeCycleId = db.activeCycleId || "cycle-2000";
  
  if (!db.configs) db.configs = [];
  let activeConfig = db.configs.find(cfg => cfg.cycleId === activeCycleId) || db.config;
  if (!activeConfig.registrationEnabled) {
    return res.status(403).json({ error: "Las inscripciones se encuentran cerradas temporalmente por el administrador." });
  }

  const { names, lastNames, phone, schoolId, email, choices, language, sex, shirtSize } = req.body;

  if (!names || !lastNames || !phone || !schoolId || !email || !choices || !Array.isArray(choices) || choices.length < 3 || !language || !sex || !shirtSize) {
    return res.status(400).json({ error: "Todos los campos son obligatorios, incluyendo los 3 comités de interés, idioma, sexo y talla de playera." });
  }

  // Validate email domain if institutional check is active
  if (!email.includes("@")) {
    return res.status(400).json({ error: "Por favor, introduce un correo electrónico válido." });
  }

  // Check unique email constraint within active cycle
  const emailExists = db.delegates.some(d => d.cycleId === activeCycleId && d.email.trim().toLowerCase() === email.trim().toLowerCase());
  if (emailExists) {
    return res.status(400).json({ error: "Ya existe un estudiante registrado con este correo electrónico institucional." });
  }

  const newDelegate: Delegate = {
    id: "del-" + Math.random().toString(36).substr(2, 9),
    names: names.trim(),
    lastNames: lastNames.trim(),
    phone: phone.trim(),
    schoolId,
    email: email.trim().toLowerCase(),
    choices,
    assignedCommitteeId: null,
    assignedCountryId: null,
    status: "pending",
    createdAt: new Date().toISOString(),
    language: language.trim() as 'Español' | 'Inglés' | 'Bilingüe',
    sex: sex.trim() as 'Hombre' | 'Mujer',
    shirtSize: shirtSize.trim() as 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL',
    roomNumber: null,
    cycleId: activeCycleId
  };

  db.delegates.push(newDelegate);
  writeDB(db);
  res.json({ success: true, delegate: newDelegate });
});

// POST add or update school
app.post("/api/schools", (req, res) => {
  const db = readDB();
  const activeCycleId = db.activeCycleId || "cycle-2000";
  const { id, name, username, passwordHash, maxQuota, roomsMale, roomsFemale, roomNumbersMale, roomNumbersFemale } = req.body;

  if (!name || !username || !passwordHash || maxQuota === undefined) {
    return res.status(400).json({ error: "Todos los campos son obligatorios para registrar una escuela." });
  }

  const quota = Number(maxQuota);
  const rm = roomsMale !== undefined ? Number(roomsMale) : 0;
  const rf = roomsFemale !== undefined ? Number(roomsFemale) : 0;

  if (id) {
    // Edit existing
    const idx = db.schools.findIndex(s => s.id === id);
    if (idx !== -1) {
      db.schools[idx] = {
        ...db.schools[idx],
        name: name.trim(),
        username: username.trim().toLowerCase(),
        passwordHash: passwordHash.trim(),
        maxQuota: quota,
        roomsMale: rm,
        roomsFemale: rf,
        roomNumbersMale: Array.isArray(roomNumbersMale) ? roomNumbersMale : [],
        roomNumbersFemale: Array.isArray(roomNumbersFemale) ? roomNumbersFemale : []
      };
      writeDB(db);
      return res.json({ success: true, school: db.schools[idx] });
    }
  } else {
    // Check if username already exists within active cycle
    const exists = db.schools.some(s => s.cycleId === activeCycleId && s.username === username.trim().toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "El nombre de usuario ya está asignado a otra escuela en este ciclo escolar." });
    }

    const newSchool: School = {
      id: "sch-" + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      username: username.trim().toLowerCase(),
      passwordHash: passwordHash.trim(),
      maxQuota: quota,
      roomsMale: rm,
      roomsFemale: rf,
      roomNumbersMale: Array.isArray(roomNumbersMale) ? roomNumbersMale : [],
      roomNumbersFemale: Array.isArray(roomNumbersFemale) ? roomNumbersFemale : [],
      cycleId: activeCycleId
    };
    db.schools.push(newSchool);
    writeDB(db);
    return res.json({ success: true, school: newSchool });
  }

  res.status(404).json({ error: "Escuela no encontrada." });
});

// DELETE school
app.delete("/api/schools/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const initialLen = db.schools.length;
  db.schools = db.schools.filter(s => s.id !== id);
  if (db.schools.length < initialLen) {
    // Optionally clear or set null schoolId on delegates, or reject delete if there are delegates
    writeDB(db);
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Escuela no encontrada." });
});

// POST add or update committee
app.post("/api/committees", (req, res) => {
  const db = readDB();
  const activeCycleId = db.activeCycleId || "cycle-2000";
  const { id, name, doubleDelegation, countries, language } = req.body;

  if (!name || !language) {
    return res.status(400).json({ error: "El nombre del comité y el idioma son requeridos." });
  }

  if (id) {
    const idx = db.committees.findIndex(c => c.id === id);
    if (idx !== -1) {
      db.committees[idx].name = name.trim();
      db.committees[idx].doubleDelegation = !!doubleDelegation;
      db.committees[idx].countries = Array.isArray(countries) ? countries : [];
      db.committees[idx].language = language.trim() as 'Español' | 'Inglés' | 'Bilingüe';
      writeDB(db);
      return res.json({ success: true, committee: db.committees[idx] });
    }
  } else {
    const newCommittee: Committee = {
      id: "com-" + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      doubleDelegation: !!doubleDelegation,
      countries: Array.isArray(countries) ? countries : [],
      language: language.trim() as 'Español' | 'Inglés' | 'Bilingüe',
      cycleId: activeCycleId
    };
    db.committees.push(newCommittee);
    writeDB(db);
    return res.json({ success: true, committee: newCommittee });
  }
  res.status(404).json({ error: "Comité no encontrado." });
});

// DELETE committee
app.delete("/api/committees/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const initialLen = db.committees.length;
  db.committees = db.committees.filter(c => c.id !== id);
  if (db.committees.length < initialLen) {
    // Set assignedCommitteeId to null for affected delegates
    db.delegates.forEach(d => {
      if (d.assignedCommitteeId === id) d.assignedCommitteeId = null;
    });
    writeDB(db);
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Comité no encontrado." });
});

// POST add or update country
app.post("/api/countries", (req, res) => {
  const db = readDB();
  const activeCycleId = db.activeCycleId || "cycle-2000";
  const { id, name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "El nombre del país es requerido." });
  }

  if (id) {
    const idx = db.countries.findIndex(c => c.id === id);
    if (idx !== -1) {
      db.countries[idx].name = name.trim();
      writeDB(db);
      return res.json({ success: true, country: db.countries[idx] });
    }
  } else {
    const newCountry: Country = {
      id: "cou-" + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      cycleId: activeCycleId
    };
    db.countries.push(newCountry);
    // Automatically link to existing committees within this active cycle for convenience
    db.committees
      .filter(c => c.cycleId === activeCycleId)
      .forEach(c => {
        if (c.countries && !c.countries.includes(newCountry.id)) {
          c.countries.push(newCountry.id);
        }
      });
    writeDB(db);
    return res.json({ success: true, country: newCountry });
  }
  res.status(404).json({ error: "País no encontrado." });
});

// DELETE country
app.delete("/api/countries/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const initialLen = db.countries.length;
  db.countries = db.countries.filter(c => c.id !== id);
  if (db.countries.length < initialLen) {
    // Set assignedCountryId to null for affected delegates
    db.delegates.forEach(d => {
      if (d.assignedCountryId === id) d.assignedCountryId = null;
    });
    // Remove from linked committee countries lists
    db.committees.forEach(c => {
      if (c.countries) {
        c.countries = c.countries.filter(cid => cid !== id);
      }
    });
    writeDB(db);
    return res.json({ success: true });
  }
  res.status(404).json({ error: "País no encontrado." });
});

// POST assign committee & country to delegate (Admin action)
app.post("/api/delegates/assign", (req, res) => {
  const db = readDB();
  const { delegateId, assignedCommitteeId, assignedCountryId } = req.body;

  const idx = db.delegates.findIndex(d => d.id === delegateId);
  if (idx === -1) {
    return res.status(404).json({ error: "Delegado no encontrado." });
  }

  const delegate = db.delegates[idx];

  // REQUIREMENT 2: Can only assign countries and committees to participants, not pending aspirants
  if (delegate.status !== "selected") {
    return res.status(400).json({ error: "Solo se puede asignar comité y país a participantes activos (Seleccionados), no a aspirantes." });
  }

  // Validate assignment if specified
  if (assignedCommitteeId && assignedCountryId) {
    const committee = db.committees.find(c => c.id === assignedCommitteeId);
    if (!committee) {
      return res.status(404).json({ error: "Comité no encontrado." });
    }

    // REQUIREMENT 1: "cada comite tiene sus propios países, por lo que deben estar ligados"
    if (committee.countries && !committee.countries.includes(assignedCountryId)) {
      return res.status(400).json({ error: "El país seleccionado no está ligado a este comité." });
    }

    // REQUIREMENT 1: "no se puede repetir país en cada comité... en pareja permite dos alumnos por país"
    const assignedCount = db.delegates.filter(d => 
      d.id !== delegateId && 
      d.assignedCommitteeId === assignedCommitteeId && 
      d.assignedCountryId === assignedCountryId
    ).length;

    const maxAllowed = committee.doubleDelegation ? 2 : 1;
    if (assignedCount >= maxAllowed) {
      return res.status(400).json({ 
        error: `Este país ya está completamente ocupado en este comité. Límite: ${maxAllowed} delegado(s) ${committee.doubleDelegation ? '(En Pareja)' : '(Individual)'}.` 
      });
    }
  }

  db.delegates[idx].assignedCommitteeId = assignedCommitteeId || null;
  db.delegates[idx].assignedCountryId = assignedCountryId || null;

  writeDB(db);
  res.json({ success: true, delegate: db.delegates[idx] });
});

// POST update delegate status (Can be done by admin or school up to school's maxQuota)
app.post("/api/delegates/status", (req, res) => {
  const db = readDB();
  const { delegateId, status, actorRole, schoolId } = req.body; // actorRole is 'admin' or 'school'

  const idx = db.delegates.findIndex(d => d.id === delegateId);
  if (idx === -1) {
    return res.status(404).json({ error: "Delegado no encontrado." });
  }

  const delegate = db.delegates[idx];

  // If school is doing it, ensure it's their delegate and check quotas
  if (actorRole === "school") {
    if (delegate.schoolId !== schoolId) {
      return res.status(403).json({ error: "No tienes permiso para modificar delegados de otra escuela." });
    }

    const school = db.schools.find(s => s.id === schoolId);
    if (!school) {
      return res.status(404).json({ error: "Escuela asociada no encontrada." });
    }

    if (status === "selected") {
      // Calculate active selections for this school (excluding the current delegate if they are already selected)
      const currentSelectedCount = db.delegates.filter(d => d.schoolId === schoolId && d.status === "selected" && d.id !== delegateId).length;
      if (currentSelectedCount >= school.maxQuota) {
        return res.status(400).json({ error: `Has alcanzado el cupo máximo de delegados admitidos (${school.maxQuota}) para tu escuela.` });
      }
    }
  }

  delegate.status = status;
  writeDB(db);
  res.json({ success: true, delegate });
});

// POST assign room to delegate (School action)
app.post("/api/delegates/assign-room", (req, res) => {
  const db = readDB();
  const { delegateId, roomNumber, schoolId } = req.body;

  const idx = db.delegates.findIndex(d => d.id === delegateId);
  if (idx === -1) {
    return res.status(404).json({ error: "Delegado no encontrado." });
  }

  const delegate = db.delegates[idx];

  // Ensure school owns this delegate
  if (delegate.schoolId !== schoolId) {
    return res.status(403).json({ error: "No tienes permiso para modificar alumnos de otra escuela." });
  }

  // Ensure delegate status is selected
  if (delegate.status !== "selected") {
    return res.status(400).json({ error: "Solo puedes asignar habitaciones a alumnos que sean participantes activos (seleccionados)." });
  }

  const school = db.schools.find(s => s.id === schoolId);
  if (!school) {
    return res.status(404).json({ error: "Escuela asociada no encontrada." });
  }

  if (roomNumber !== null && roomNumber !== undefined && roomNumber !== "") {
    const rNum = Number(roomNumber);
    if (isNaN(rNum) || rNum <= 0) {
      return res.status(400).json({ error: "Número de habitación inválido." });
    }

    const maxRooms = delegate.sex === "Hombre" ? (school.roomsMale || 0) : (school.roomsFemale || 0);
    if (rNum > maxRooms) {
      return res.status(400).json({ 
        error: `La habitación #${rNum} no está disponible. Tu escuela solo tiene asignadas ${maxRooms} habitaciones para ${delegate.sex === "Hombre" ? "hombres" : "mujeres"}.` 
      });
    }

    delegate.roomNumber = rNum;
  } else {
    delegate.roomNumber = null;
  }

  writeDB(db);
  res.json({ success: true, delegate });
});

// POST update delegate details (Admin action)
app.post("/api/delegates/update", (req, res) => {
  const db = readDB();
  const activeCycleId = db.activeCycleId || "cycle-2000";
  const { id, names, lastNames, phone, email, sex, shirtSize, language, schoolId, choices } = req.body;

  if (!id) {
    return res.status(400).json({ error: "ID del delegado es requerido." });
  }

  const idx = db.delegates.findIndex(d => d.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Delegado no encontrado." });
  }

  const delegate = db.delegates[idx];

  // Validate email if changed
  if (email && email.trim().toLowerCase() !== delegate.email.trim().toLowerCase()) {
    if (!email.includes("@")) {
      return res.status(400).json({ error: "Por favor, introduce un correo electrónico válido." });
    }
    const emailExists = db.delegates.some(d => d.cycleId === activeCycleId && d.id !== id && d.email.trim().toLowerCase() === email.trim().toLowerCase());
    if (emailExists) {
      return res.status(400).json({ error: "Ya existe otro estudiante registrado con este correo electrónico." });
    }
    delegate.email = email.trim();
  }

  if (names) delegate.names = names.trim();
  if (lastNames) delegate.lastNames = lastNames.trim();
  if (phone) delegate.phone = phone.trim();
  if (sex) delegate.sex = sex;
  if (shirtSize) delegate.shirtSize = shirtSize;
  if (language) delegate.language = language;
  if (schoolId) delegate.schoolId = schoolId;
  if (Array.isArray(choices)) delegate.choices = choices;

  writeDB(db);
  res.json({ success: true, delegate });
});

// POST record payment and generate receipt (with overflow allocation!)
app.post("/api/payments", (req, res) => {
  const db = readDB();
  const { studentId, amount, paymentIndex, notes } = req.body;

  if (!studentId || !amount) {
    return res.status(400).json({ error: "ID del alumno y monto son requeridos." });
  }

  const student = db.delegates.find(d => d.id === studentId);
  if (!student) {
    return res.status(404).json({ error: "Alumno no encontrado." });
  }

  const paymentVal = Number(amount);
  if (isNaN(paymentVal) || paymentVal <= 0) {
    return res.status(400).json({ error: "Monto inválido." });
  }

  const N = db.config.numPaymentsRequired;
  const A = db.config.paymentAmount;

  // Calculate total paid so far
  const existingPayments = db.payments.filter(p => p.studentId === studentId);
  const totalPaidSoFar = existingPayments.reduce((sum, p) => sum + p.amount, 0);

  const maxTotalAllowed = N * A;
  if (totalPaidSoFar >= maxTotalAllowed) {
    return res.status(400).json({ error: "El alumno ya ha liquidado todos sus pagos correspondientes." });
  }

  // Let's allocate the incoming payment amount to consecutive payment slots
  let remainingToAllocate = paymentVal;
  const createdPayments: Payment[] = [];

  // Cap allocation to the max total remaining
  const maxOwedRemaining = maxTotalAllowed - totalPaidSoFar;
  if (remainingToAllocate > maxOwedRemaining) {
    remainingToAllocate = maxOwedRemaining;
  }

  // Distribute
  for (let k = 1; k <= N && remainingToAllocate > 0; k++) {
    // Calc previous paid for this specific slot k
    const prevPaidForSlotK = existingPayments
      .filter(p => p.paymentIndex === k)
      .reduce((sum, p) => sum + p.amount, 0);

    const remInSlotK = A - prevPaidForSlotK;
    if (remInSlotK > 0) {
      const alloc = Math.min(remainingToAllocate, remInSlotK);
      if (alloc > 0) {
        const newFolio = db.config.currentReceiptFolio;
        db.config.currentReceiptFolio += 1;

        const newPayment: Payment = {
          id: "pay-" + Math.random().toString(36).substr(2, 9),
          folio: newFolio,
          studentId,
          amount: alloc,
          paymentIndex: k,
          date: new Date().toISOString().split("T")[0],
          notes: notes ? notes.trim() : "",
          cycleId: db.activeCycleId || "cycle-2000"
        };

        db.payments.push(newPayment);
        createdPayments.push(newPayment);
        remainingToAllocate -= alloc;
      }
    }
  }

  // Fallback
  if (createdPayments.length === 0) {
    const newFolio = db.config.currentReceiptFolio;
    db.config.currentReceiptFolio += 1;
    const fallbackPayment: Payment = {
      id: "pay-" + Math.random().toString(36).substr(2, 9),
      folio: newFolio,
      studentId,
      amount: paymentVal,
      paymentIndex: Number(paymentIndex) || 1,
      date: new Date().toISOString().split("T")[0],
      notes: notes ? notes.trim() : "",
      cycleId: db.activeCycleId || "cycle-2000"
    };
    db.payments.push(fallbackPayment);
    createdPayments.push(fallbackPayment);
  }

  writeDB(db);
  res.json({ success: true, payments: createdPayments, payment: createdPayments[0] });
});

// POST batch payments for school students
app.post("/api/payments/batch", (req, res) => {
  const db = readDB();
  const { payments } = req.body; // Array of { studentId, amount, notes }

  if (!payments || !Array.isArray(payments) || payments.length === 0) {
    return res.status(400).json({ error: "Lista de pagos no proporcionada o vacía." });
  }

  const batchId = "batch-" + Math.random().toString(36).substr(2, 9);
  const N = db.config.numPaymentsRequired;
  const A = db.config.paymentAmount;
  const allCreatedPayments: Payment[] = [];

  for (const pItem of payments) {
    const { studentId, amount, notes } = pItem;
    if (!studentId || !amount) continue;

    const student = db.delegates.find(d => d.id === studentId);
    if (!student) continue;

    const paymentVal = Number(amount);
    if (isNaN(paymentVal) || paymentVal <= 0) continue;

    const existingPayments = db.payments.filter(p => p.studentId === studentId);
    const totalPaidSoFar = existingPayments.reduce((sum, p) => sum + p.amount, 0);

    const maxTotalAllowed = N * A;
    if (totalPaidSoFar >= maxTotalAllowed) continue;

    let remainingToAllocate = paymentVal;
    const maxOwedRemaining = maxTotalAllowed - totalPaidSoFar;
    if (remainingToAllocate > maxOwedRemaining) {
      remainingToAllocate = maxOwedRemaining;
    }

    for (let k = 1; k <= N && remainingToAllocate > 0; k++) {
      const prevPaidForSlotK = existingPayments
        .filter(p => p.paymentIndex === k)
        .reduce((sum, p) => sum + p.amount, 0);

      const remInSlotK = A - prevPaidForSlotK;
      if (remInSlotK > 0) {
        const alloc = Math.min(remainingToAllocate, remInSlotK);
        if (alloc > 0) {
          const newFolio = db.config.currentReceiptFolio;
          db.config.currentReceiptFolio += 1;

          const newPayment: Payment = {
            id: "pay-" + Math.random().toString(36).substr(2, 9),
            folio: newFolio,
            studentId,
            amount: alloc,
            paymentIndex: k,
            date: new Date().toISOString().split("T")[0],
            notes: notes ? notes.trim() : "",
            batchId,
            cycleId: db.activeCycleId || "cycle-2000"
          };

          db.payments.push(newPayment);
          allCreatedPayments.push(newPayment);
          remainingToAllocate -= alloc;
        }
      }
    }
  }

  if (allCreatedPayments.length === 0) {
    return res.status(400).json({ error: "No se pudo procesar ningún pago. Verifica montos y deudas." });
  }

  writeDB(db);
  res.json({ success: true, payments: allCreatedPayments });
});

// POST create school cycle
app.post("/api/cycles", (req, res) => {
  const db = readDB();
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "El nombre del ciclo escolar es obligatorio." });
  }

  const newCycleId = "cycle-" + Math.random().toString(36).substr(2, 9);
  const newCycle = {
    id: newCycleId,
    name: name.trim(),
    isActive: false
  };

  if (!db.cycles) db.cycles = [];
  db.cycles.push(newCycle);

  // Initialize a new default config for this cycle
  if (!db.configs) db.configs = [];
  db.configs.push({
    ...initialConfig,
    cycleId: newCycleId
  });

  writeDB(db);
  res.json({ success: true, cycle: newCycle, cycles: db.cycles });
});

// POST set active school cycle
app.post("/api/cycles/active", (req, res) => {
  const db = readDB();
  const { cycleId } = req.body;

  if (!db.cycles || !db.cycles.some(c => c.id === cycleId)) {
    return res.status(404).json({ error: "Ciclo escolar no encontrado." });
  }

  db.cycles.forEach(c => {
    c.isActive = (c.id === cycleId);
  });

  db.activeCycleId = cycleId;

  // Initialize config for the new active cycle if it doesn't exist
  if (!db.configs) db.configs = [];
  let activeCfg = db.configs.find(cfg => cfg.cycleId === cycleId);
  if (!activeCfg) {
    activeCfg = {
      ...initialConfig,
      cycleId: cycleId
    };
    db.configs.push(activeCfg);
  }
  db.config = { ...activeCfg };

  writeDB(db);
  res.json({ success: true, activeCycleId: cycleId, cycles: db.cycles });
});

// POST add or update admin user
app.post("/api/admins", (req, res) => {
  const db = readDB();
  const { id, name, username, passwordHash, role } = req.body;

  if (!name || !username || !passwordHash || !role) {
    return res.status(400).json({ error: "Todos los campos del administrador son requeridos." });
  }

  if (!db.adminUsers) {
    db.adminUsers = [];
  }

  if (id) {
    const idx = db.adminUsers.findIndex(u => u.id === id);
    if (idx !== -1) {
      db.adminUsers[idx].name = name.trim();
      db.adminUsers[idx].username = username.trim().toLowerCase();
      db.adminUsers[idx].passwordHash = passwordHash.trim();
      db.adminUsers[idx].role = role;
      writeDB(db);
      return res.json({ success: true, adminUser: db.adminUsers[idx] });
    }
  } else {
    // Check if username exists
    const exists = db.adminUsers.some(u => u.username === username.trim().toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "El nombre de usuario ya está asignado a otro administrador." });
    }

    const newAdmin: AdminUser = {
      id: "adm-" + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      username: username.trim().toLowerCase(),
      passwordHash: passwordHash.trim(),
      role: role
    };
    db.adminUsers.push(newAdmin);
    writeDB(db);
    return res.json({ success: true, adminUser: newAdmin });
  }
  res.status(404).json({ error: "Administrador no encontrado." });
});

// DELETE admin user
app.delete("/api/admins/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  if (!db.adminUsers) db.adminUsers = [];

  const initialLen = db.adminUsers.length;
  const adminToDelete = db.adminUsers.find(u => u.id === id);
  if (adminToDelete?.username === "admin") {
    return res.status(400).json({ error: "No se puede eliminar al administrador principal del sistema." });
  }

  db.adminUsers = db.adminUsers.filter(u => u.id !== id);
  if (db.adminUsers.length < initialLen) {
    writeDB(db);
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Administrador no encontrado." });
});

// DELETE payment
app.delete("/api/payments/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const initialLen = db.payments.length;
  db.payments = db.payments.filter(p => p.id !== id);
  if (db.payments.length < initialLen) {
    writeDB(db);
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Pago no encontrado." });
});

// --- CLIENT & VITE SERVER ---

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

start();
