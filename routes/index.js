const express = require("express");
const Joi = require('@hapi/joi');
var   bcrypt = require("bcryptjs");
const mysql = require("mysql");
var   fs = require("fs");
var   XLSX = require("xlsx");
var   cors = require("cors");
const csv = require("csv-stream");
var router = express.Router();
router.use(cors());
// Verbindung zur Datenbank erstellen

const pool = mysql.createPool(
  {
    connectionLimit: 10,
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "venator_db"
  },
  { multipleStatements: true }
);

// **************************************************************************

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

// Api's

// GET Files
router.get("/api/dateien", (req, res) => {
  const filesFolder = "./uploads/";
  var dateien = [];
  var i = 0;
  fs.readdir(filesFolder, (err, uploads) => {
    uploads.forEach(datei => {
      dateien.push({ name: datei });
    });
    console.log(dateien);
    res.send(dateien);
  });
});

/* Get alle die Konten */
router.get("/api/konten", (req, res) => {
  var selectAll = "SELECT * FROM Konten";
  const Konten = pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    res.send(results);
  });
});

// GET ein Konto
router.get("/api/Konten/:id", (req, res) => {
  const selectId = `SELECT * FROM Konten WHERE id= ${parseInt(req.params.id)}`;
  const Konto = pool.query(selectId, (err, results) => {
    if (!Konto) return res.status(404).send("Die Id ist nicht vorhanden");
    else res.send(results);
    //  res.render('konto', { arr : results[0] } );
  });
});
// GET alle die GegenKomnten
router.get("/api/gegenkonten", (req, res) => {
  var selectAll = "SELECT * FROM gegenkonten";
  const Kunden = pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    res.send(results);
  });
});



// GET alle die Kunden
router.get("/api/kunden", (req, res) => {
  var selectAll = "SELECT * FROM kunden";
  const Kunden = pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    res.send(results)
  });
});

// Validate KundenPasswort
router.get("/api/kunden/validatePassword/:username/:password", (req, res) => {
  bool = false;
  const selectId = `SELECT passwort FROM Kunden WHERE benutzername= "${req.params.username}" OR email="${req.params.username}" `;
  const Kunde = pool.query(selectId, (err, results) => {
    if (!Kunde) {
      console.log("kein Kunde")

    }
    else {
      console.log(results)
      bcrypt.compare(req.params.password, results[0].passwort, function (err, isMatch) {
        if (err) {
          console.log("falsches Passwort")
          throw err;

        }
        if (isMatch) {
          console.log("Pass ist richtig")
          res.send(results)
          bool = true
        } else bool = false;
      })
    }

  });
  if (bool) {
    return true;
  } else return false;
})

// Validate AdminPasswort
router.get("/api/admin/validatePassword/:username/:password/login", (req, res) => {

  bool = false;
  const selectId = `SELECT * FROM adminstrator WHERE benutzername= "${req.params.username}" OR email="${req.params.username}" `;
  pool.query(selectId, (error, results) => {
    if (error) {
      console.log("kein Admin")
      res.send("kein Admin")
    }
    else {
      bcrypt.compare(req.params.password, results[0].passwort, function (err, isMatch) {
        if (!isMatch) {
          console.log("falsches Passwort")
          res.send("falsches Passwort")
        }
        else if (isMatch) {
          console.log("results")
          res.status(200).send(results)
          bool = true
        } else bool = false;
      })
    }

  });
  if (bool) {
    return true;
  } else return false;
})
// Validate benutzerPasswort
router.get("/api/benutzer/validatePassword/:username/:password/login", (req, res) => {
  bool = false;
  const selectId = `SELECT * FROM benutzer WHERE benutzername= "${req.params.username}" OR email="${req.params.username}" `;
  pool.query(selectId, (err, results) => {
    if (err) {
      console.log("kein Kunde")
    }
    else {
      bcrypt.compare(req.params.password, results[0].passwort, function (err, isMatch) {
        if (!isMatch) {
          console.log("falsches Passwort")
          res.send("falsches Passwort")
        }
        if (isMatch) {
          res.status(200).send(results)
          bool = true
        } else bool = false;
      })
    }

  });
  if (bool) {
    return true;
  } else return false;
})
// GET einen Kunden
router.get("/api/Kunden/:benutzername", (req, res) => {
  const selectId = `SELECT * FROM Kunden WHERE benutzername= "${req.params.benutzername}" OR email= "${req.params.benutzername}" `;
  const Kunde = pool.query(selectId, (err, results) => {
    if (!Kunde) return res.status(404).send("Der Benutzername ist nicht vorhanden");
    else {
      console.log("results: ", results)
      res.send(results);
    }
  });
});
// GET einen Kunden
router.get("/api/Kunden/:id", (req, res) => {
  const selectId = `SELECT * FROM Kunden WHERE id= ${parseInt(req.params.id)}`;
  const Kunde = pool.query(selectId, (err, results) => {
    if (!Kunde) return res.status(404).send("Die Id ist nicht vorhanden");
    else res.send(results);
  });
});


//  die BenutzerId vom aktuellen Benutzer bekommen
router.get("/api/benutzerId/:benutzername", (req, res) => {
  console.log(req.params.benutzername)
  var selectId = `SELECT id FROM benutzer WHERE  benutzername = "${req.params.benutzername}" OR email = "${req.params.benutzername}" `;
  console.log(selectId)
  const userId = pool.query(selectId, (err, results) => {
    if (err) {
      console.log("Fehler bei der Anfrage");
      return res.send(err);
    }
    console.log(results)
    res.send(results);
  });
});

// GET die kundenId vom aktuellen User
router.get("/api/kunden/kundenId/:benutzerId", (req, res) => {
  let selectId = `SELECT kundenId FROM benutzer WHERE  id="${req.params.benutzerId}"  `;

  const kundenId = pool.query(selectId, (err, results) => {
    if (err) {
      console.log("Fehler bei der Anfrage");
      return res.send(err);
    }
    console.log("Id:", results)
    res.send(results);
  });
});

// Alle Verfahren
router.get("/api/verfahren", (req, res) => {
  var selectAll = `SELECT * FROM verfahren  `;
  const x = pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }

    res.send(results);
  });
});
// Alle Benutzer
router.get("/api/benutzer", (req, res) => {
  var selectAll = `SELECT * FROM benutzer  `;
  const x = pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    res.send(results);
  });
});
// GET die Verfahren vom aktuellen Kunden
router.get("/api/verfahren/:id", (req, res) => {
  var selectAll = `SELECT * FROM verfahren WHERE  kundenId= "${req.params.id}" `;
  const x = pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    res.send(results);
  });
});
// GET die Verfahren vom aktuellen Kunden
router.get("/api/verfahrenVomBenutzer/:id", (req, res) => {
  var selectAll = `SELECT * FROM verfahren WHERE  id= "${req.params.id}" `;
  const x = pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log(results)
    res.send(results);
  });
});
// GET die Details vom aktuellen Kunden
router.get("/api/details/:kundenId", (req, res) => {
  var selectAll = `SELECT * FROM kunden WHERE  id= "${req.params.kundenId}" `;
  const x = pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log(results)
    res.send(results);
  });
});
// GET die Benutzer vom aktuellen Kunden
router.get("/api/benutzer/kundenId/:kundenId", (req, res) => {
  var selectAll = `SELECT * FROM benutzer WHERE  kundenId= "${req.params.kundenId}" `;
  const x = pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    res.send(results);
  });
});

// GET die Benutzer vom aktuellen Kunden
router.post("/api/benutzerVerfahrenRolle", (req, res) => {
  let select = `SELECT * FROM benutzerverfahren WHERE benutzerId = "${req.body.benutzerId}" AND verfahrenId = "${req.body.verfahrenId}"  `;
  pool.query(select, (err, results) => {
    if (err) {
      console.log("error", err);
      return res.send(err);
    } else if (results.length > 0) {
      let update = `UPDATE  benutzerverfahren SET rolle = "${req.body.rolle}"
                       WHERE benutzerId="${req.body.benutzerId}" AND verfahrenId = "${req.body.verfahrenId}" `;
      const c = pool.query(update, (err2, results2) => {
        if (err2) {
          console.log(err2);
          return res.send(err2);
        }
        res.send(results2);
      });

    } else {
      let insert = `INSERT  INTO benutzerverfahren (benutzerId, verfahrenId, rolle)
      VALUES ("${req.body.benutzerId}", "${req.body.verfahrenId}", "${req.body.rolle}" ) `;
      const y = pool.query(insert, (err1, results1) => {
        if (err1) {
          console.log(err1);
          return res.send(err1);
        }
        res.send(results1);
      });
    }
  });

});
// GET die Rolle  des aktuellen Benutzers vom aktuellen Verfahren
router.get("/api/benutzerRolle/:benutzerId", (req, res) => {
  let selectAll = `SELECT rolle FROM benutzer WHERE  id= "${req.params.benutzerId}"  `;
  connection.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log(results[0].rolle)
    res.json(results[0].rolle);
  });
});

// GET die Benutzer des aktuellen Verfahrens
router.get("/api/aktuellenVerfahrenBenutzer/:verfahrenId", (req, res) => {
  var selectAll = `SELECT * FROM benutzerverfahren WHERE  verfahrenId= "${req.params.verfahrenId}" `;
  const x = pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    res.send(results);
  });
});

// GET die VerfahrenID des aktuellen Benutzers 
router.get("/api/aktuellenBenutzerVerfahren/:benutzerId", (req, res) => {
  var selectAll = `SELECT verfahrenId, rolle FROM benutzerverfahren WHERE  benutzerId= "${req.params.benutzerId}" `;
  const x = pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }

    res.send(results);
  });
});

// GET die Rolle  des aktuellen Benutzers vom aktuellen Verfahren
router.get("/api/benutzerVerfahren/rolle/:verfahrenId/:benutzerId", (req, res) => {
  let selectAll = `SELECT rolle FROM benutzerverfahren WHERE  benutzerId= "${req.params.benutzerId}" AND verfahrenId= "${req.params.verfahrenId}" `;
  pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log(results)
    res.send(results);
  });
});


// GET alle die  Buchungen
router.get("/api/buchungen/:verfahrenId/:startPunkt", (req, res) => {

  var select2 = `SELECT * FROM buchungen WHERE verfahrenId = ${parseInt(req.params.verfahrenId)}
   ORDER BY id 
   limit ${req.params.startPunkt}, 10
   `;

  pool.query(select2, (err, results2) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }

    res.json(results2)
  });

});
// GET alle die gefilterten DATEV Buchungen

router.get("/api/SAPbuchungen/:verfahrenId/:startPunkt", (req, res) => {
  let select = `SELECT * FROM sap
  WHERE verfahrenId = ${parseInt(req.params.verfahrenId)}
  ORDER BY 'id' DESC
  limit ${req.params.startPunkt}, 10

    `;
  pool.query(select, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    else if (results.length > 0) {
      results.map(elem => {
        if (elem.betragHW) {
          elem.betragHW = Number(elem.betragHW.replace(".", "").replace(",", "."))
          elem.betragHW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.betragHW)
        }
        if (elem.betragTW) {
          elem.betragTW = Number(elem.betragTW.replace(".", "").replace(",", "."))
          elem.betragTW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.betragTW)
        }
        if (elem.skontoHW) {
          elem.skontoHW = Number(elem.skontoHW.replace(".", "").replace(",", "."))
          elem.skontoHW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.skontoHW)
        }
        if (elem.skontoTW) {
          elem.skontoTW = Number(elem.skontoTW.replace(".", "").replace(",", "."))
          elem.skontoTW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.skontoTW)
        }
      })
      console.log(select)
      res.json(results)
    }
  });

});
router.get("/api/SAPgetAllFirstFilteredData/:verfahrenId/:filter/:feld", (req, res) => {
  let select = `SELECT * FROM sap 
  WHERE verfahrenId = ${parseInt(req.params.verfahrenId)} AND ${req.params.feld} = ${req.params.filter}
   ORDER BY id  DESC
    `;
  if (select) {

    pool.query(select, (err, results) => {
      if (err) {
        console.log(err);
        return res.send(err);

      } else if (results.length > 0) {
        results.map(elem => {
          if (elem.betragHW) {
            elem.betragHW = Number(elem.betragHW.replace(".", "").replace(",", "."))
            elem.betragHW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.betragHW)
          }
          if (elem.betragTW) {
            elem.betragTW = Number(elem.betragTW.replace(".", "").replace(",", "."))
            elem.betragTW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.betragTW)
          }
          if (elem.skontoHW) {
            elem.skontoHW = Number(elem.skontoHW.replace(".", "").replace(",", "."))
            elem.skontoHW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.skontoHW)
          }
          if (elem.skontoTW) {
            elem.skontoTW = Number(elem.skontoTW.replace(".", "").replace(",", "."))
            elem.skontoTW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.skontoTW)
          }
        })
        console.log(select)
        res.json(results)

      }
    });
  } else {
    console.log("Kein Treffer")
  }
})
router.get("/api/SAPgetAllSecondFilteredData/:verfahrenId/:filter1/:feld1/:filter2/:feld2", (req, res) => {
  let select = `SELECT * FROM sap 
  WHERE verfahrenId = ${parseInt(req.params.verfahrenId)} AND ${req.params.feld1} = ${req.params.filter1} AND ${req.params.feld2} = ${req.params.filter2}
   ORDER BY id  DESC
    `;
  if (select) {

    pool.query(select, (err, results) => {
      if (err) {
        console.log(err);
        return res.send(err);

      } else if (results.length > 0) {
        results.map(elem => {
          if (elem.betragHW) {
            elem.betragHW = Number(elem.betragHW.replace(".", "").replace(",", "."))
            elem.betragHW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.betragHW)
          }
          if (elem.betragTW) {
            elem.betragTW = Number(elem.betragTW.replace(".", "").replace(",", "."))
            elem.betragTW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.betragTW)
          }
          if (elem.skontoHW) {
            elem.skontoHW = Number(elem.skontoHW.replace(".", "").replace(",", "."))
            elem.skontoHW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.skontoHW)
          }
          if (elem.skontoTW) {
            elem.skontoTW = Number(elem.skontoTW.replace(".", "").replace(",", "."))
            elem.skontoTW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.skontoTW)
          }
        })
        console.log(select)
        res.json(results)

      }

    });
  } else {
    console.log("Kein Treffer")
  }
})
router.get("/api/SAPgetSecondFilteredData/:verfahrenId/:filter1/:feld1/:filter2/:feld2/:startPunkt", (req, res) => {
  var select = `SELECT * FROM sap 
    WHERE verfahrenId = "${parseInt(req.params.verfahrenId)}" AND ${req.params.feld1} = "${req.params.filter1}" AND ${req.params.feld2} = "${req.params.filter2}"
     ORDER BY id  limit  ${req.params.startPunkt}, 10
      `;


  if (select) {

    pool.query(select, (err, results) => {
      if (err) {
        console.log(err);
      } else if (results.length > 0) {
        results.map(elem => {
          if (elem.betragHW) {
            elem.betragHW = Number(elem.betragHW.replace(".", "").replace(",", "."))
            elem.betragHW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.betragHW)
          }
          if (elem.betragTW) {
            elem.betragTW = Number(elem.betragTW.replace(".", "").replace(",", "."))
            elem.betragTW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.betragTW)
          }
          if (elem.skontoHW) {
            elem.skontoHW = Number(elem.skontoHW.replace(".", "").replace(",", "."))
            elem.skontoHW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.skontoHW)
          }
          if (elem.skontoTW) {
            elem.skontoTW = Number(elem.skontoTW.replace(".", "").replace(",", "."))
            elem.skontoTW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.skontoTW)
          }
        })
        console.log(select)
        res.json(results)

      }

    });
  } else {
    console.log("kein Treffer")
    res.json({ Message: "kein Treffer" })

  }
})
router.get("/api/SAPgetFirstFilteredData/:verfahrenId/:filter/:feld/:startPunkt", (req, res) => {
  var select = `SELECT * FROM sap 
    WHERE verfahrenId = "${parseInt(req.params.verfahrenId)}" AND ${req.params.feld} = "${req.params.filter}"
     ORDER BY id  limit  ${req.params.startPunkt}, 10
      `;


  if (select) {

    pool.query(select, (err, results) => {
      if (err) {
        console.log(err);
      } else if (results.length > 0) {
        results.map(elem => {
          if (elem.betragHW) {
            elem.betragHW = Number(elem.betragHW.replace(".", "").replace(",", "."))
            elem.betragHW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.betragHW)
          }
          if (elem.betragTW) {
            elem.betragTW = Number(elem.betragTW.replace(".", "").replace(",", "."))
            elem.betragTW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.betragTW)
          }
          if (elem.skontoHW) {
            elem.skontoHW = Number(elem.skontoHW.replace(".", "").replace(",", "."))
            elem.skontoHW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.skontoHW)
          }
          if (elem.skontoTW) {
            elem.skontoTW = Number(elem.skontoTW.replace(".", "").replace(",", "."))
            elem.skontoTW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.skontoTW)
          }
        })
        console.log(select)
        res.json(results)
      }

    });
  } else {
    console.log("kein Treffer")
    res.json({ Message: "kein Treffer" })

  }
})
router.get("/api/SAPgetTextFirstFilteredData/:verfahrenId/:filter/:feld/:startPunkt", (req, res) => {
  var select = `SELECT DISTINCT ${req.params.feld} FROM sap 
      WHERE verfahrenId = "${parseInt(req.params.verfahrenId)}" AND ${req.params.feld} LIKE "%${req.params.filter}%"
       ORDER BY id DESC 
        `;

  if (select) {

    pool.query(select, (err, results) => {
      if (err) {
        console.log(err);
      } else if (results.length > 0) {
        console.log(select)
        res.json(results)
      }

    });
  } else {
    console.log("kein Treffer")
    res.json({ Message: "kein Treffer" })

  }
})
router.get("/api/SAPgetTextSecondFilteredData/:verfahrenId/:filter1/:feld1/:filter2/:feld2/:startPunkt", (req, res) => {
  var select = `SELECT DISTINCT ${req.params.feld1},${req.params.feld2} FROM sap 
      WHERE verfahrenId = "${parseInt(req.params.verfahrenId)}" AND ${req.params.feld1} = "${req.params.filter1}" AND ${req.params.feld2} LIKE "%${req.params.filter2}%"
       ORDER BY id DESC limit  ${req.params.startPunkt}, 10
        `;

  if (select) {

    pool.query(select, (err, results) => {
      if (err) {
        console.log(err);
      } else if (results.length > 0) {

        console.log(select)
        res.json(results)

      }

    });
  } else {
    console.log("kein Treffer")
    res.json({ Message: "kein Treffer" })

  }
})
router.get("/api/SAPlastPageData/:verfahrenId/:firstId", (req, res) => {
  let select = `
  SELECT * FROM ( SELECT * FROM sap ORDER BY id  DESC LIMIT 10 ) AS t WHERE verfahrenId = ${parseInt(req.params.verfahrenId)}
    `;
  console.log(select)
  pool.query(select, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    else if (results.length > 0) {
      results.map(elem => {
        if (elem.betragHW) {
          elem.betragHW = Number(elem.betragHW.replace(".", "").replace(",", "."))
          elem.betragHW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.betragHW)
        }
        if (elem.betragTW) {
          elem.betragTW = Number(elem.betragTW.replace(".", "").replace(",", "."))
          elem.betragTW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.betragTW)
        }
        if (elem.skontoHW) {
          elem.skontoHW = Number(elem.skontoHW.replace(".", "").replace(",", "."))
          elem.skontoHW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.skontoHW)
        }
        if (elem.skontoTW) {
          elem.skontoTW = Number(elem.skontoTW.replace(".", "").replace(",", "."))
          elem.skontoTW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.skontoTW)
        }
      })
      let pageNr = (results[0].id - req.params.firstId) / 10
      pageNr = Math.ceil(pageNr)
      let startNr = Math.ceil(results[0].id - req.params.firstId) - 9
      console.log(pageNr, startNr)
      res.json({ results: results, pageNr: pageNr, startNr: startNr })
    }

  });

});
router.get("/api/SAPlastPageFirstFilteredData/:verfahrenId/:firstId/:filter/:feld", (req, res) => {
  let select = `

  SELECT * FROM ( SELECT * FROM sap WHERE verfahrenId = ${parseInt(req.params.verfahrenId)} AND ${req.params.feld} = "${req.params.filter}" ORDER BY id  DESC LIMIT 10 ) AS t  ORDER BY id  
    `;
  console.log(select)
  pool.query(select, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    } else if (results.length > 0) {
      results.map(elem => {
        if (elem.betragHW) {
          elem.betragHW = Number(elem.betragHW.replace(".", "").replace(",", "."))
          elem.betragHW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.betragHW)
        }
        if (elem.betragTW) {
          elem.betragTW = Number(elem.betragTW.replace(".", "").replace(",", "."))
          elem.betragTW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.betragTW)
        }
        if (elem.skontoHW) {
          elem.skontoHW = Number(elem.skontoHW.replace(".", "").replace(",", "."))
          elem.skontoHW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.skontoHW)
        }
        if (elem.skontoTW) {
          elem.skontoTW = Number(elem.skontoTW.replace(".", "").replace(",", "."))
          elem.skontoTW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.skontoTW)
        }
      })
      let pageNr = (results[0].id - req.params.firstId) / 10
      pageNr = Math.ceil(pageNr)
      let startNr = Math.ceil(results[0].id - req.params.firstId) - 9
      console.log(pageNr, startNr)
      res.json({ results: results, pageNr: pageNr, startNr: startNr })
    }
  });

});
router.get("/api/SAPlastPageSecondFilteredData/:verfahrenId/:firstId/:filter1/:feld1/:filter2/:feld2", (req, res) => {
  let select = `
  SELECT * FROM ( SELECT * FROM sap WHERE verfahrenId = ${parseInt(req.params.verfahrenId)} AND ${req.params.feld1} = "${req.params.filter1}" AND ${req.params.feld2} = "${req.params.filter2}" ORDER BY id  DESC LIMIT 10 ) AS t  ORDER BY id  
    `;
  console.log(select)
  pool.query(select, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    } else if (results.length > 0) {
      results.map(elem => {
        if (elem.betragHW) {
          elem.betragHW = Number(elem.betragHW.replace(".", "").replace(",", "."))
          elem.betragHW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.betragHW)
        }
        if (elem.betragTW) {
          elem.betragTW = Number(elem.betragTW.replace(".", "").replace(",", "."))
          elem.betragTW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.betragTW)
        }
        if (elem.skontoHW) {
          elem.skontoHW = Number(elem.skontoHW.replace(".", "").replace(",", "."))
          elem.skontoHW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.skontoHW)
        }
        if (elem.skontoTW) {
          elem.skontoTW = Number(elem.skontoTW.replace(".", "").replace(",", "."))
          elem.skontoTW = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(elem.skontoTW)
        }
      })
      let pageNr = (results[0].id - req.params.firstId) / 10
      pageNr = Math.ceil(pageNr)
      let startNr = Math.ceil(results[0].id - req.params.firstId) - 9
      console.log(pageNr, startNr)
      res.json({ results: results, pageNr: pageNr, startNr: startNr })
    }
  });

});
// Upload das GeschäftsJahr
router.post("/SAPverfahrenIdInsert", function (req, res) {
  global.verfahrenId = req.body.id;
  console.log(verfahrenId)
  //res.redirect("/");
});
// Upload das GeschäftsJahr
/* router.post("/geschaeftsJahrInsert", function (req, res) {
  global.geschaeftsJahr = req.body.year;
  global.verfahrenId = req.body.id;

  res.redirect("/");
}); */
// ****************************************************************************

// ****************************************************************************
// Upload SAP Buchungfile with Express
router.post("/SAPbuchungenUploadALT", function (req, res) {
  // File Upload **********

  if (req.files === null) {
    return res.status(400).json({ msg: "keine Datei wurde hochgeladen !" });
  }
  const file = req.files.file;
  const path = `./uploads/${file.name} `;

  file.mv(path, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }

    var options = {
      delimiter: ';', // default is ,
      endLine: '\n', // default is \n,
      columns: [
        'mdt',
        'buKr',
        'belegnr',
        'jahr1',
        'periode',
        'pos1',
        'bS',
        'koart',
        'sK',
        'hauptbuch',
        'gsBe',
        'partner',
        'sH',
        'betragTW',
        'betragHW',
        'hW2Betrag',
        'hW3Betrag',
        'skontoTW',
        'skontoHW',
        'skontoHW2',
        'skontoHW3',
        'zuordnung',
        'kreditor',
        'debitor',
        'steuerstandort',
        'bME',
        'menge',
        'kKrs',
        'pSPElement',
        'auftrag',
        'kostenst',
        'prctr',
        'werk',
        'anlage',
        'uNr',
        'ausglbel',
        'ausgleich'
      ], // by default read the first line and use values found as columns
      columnOffset: 0, // default is 0
      escapeChar: '"', // default is an empty string
      enclosedChar: '"' // default is an empty string
    }

    var csvStream = csv.createStream(options);
    var i = 0;
    fs.createReadStream(path).pipe(csvStream)
      .on('error', function (err) {
        console.log(err);
      })
      .on('data', function (data) {

        // outputs an object containing a set of key/value pair representing a line found in the csv file.
        i++;
        insertAnfrage = ` INSERT INTO sap
      (
        datenQuelle, verfahrenId, mdt, buKr, belegnr, jahr1, periode, pos1,
        bS, koart, sK, hauptbuch, sH, betragTW, betragHW, hW2Betrag, hW3Betrag, skontoTW,
        skontoHW, skontoHW2, skontoHW3, zuordnung, kreditor, debitor, auftrag, kostenst, prctr, werk, 
        anlage, uNr, ausglbel, ausgleich 
      )
    VALUES(
      "sap", "${verfahrenId}", "${data.mdt}", "${data.buKr}", "${data.belegnr}", "${data.jahr1}", "${data.periode}", "${data.pos1}",
      "${data.bS}", "${data.koart}", "${data.sK}", "${data.hauptbuch}", "${data.sH}", "${data.betragTW}", "${data.betragHW}", "${data.hW2Betrag}", "${data.hW3Betrag}", "${data.skontoTW}",
      "${data.skontoHW}", "${data.skontoHW2}", "${data.skontoHW3}", "${data.zuordnung}", "${data.kreditor}", "${data.debitor}", 
      "${data.auftrag}", "${data.kostenst}", "${data.prctr}", "${data.werk}", 
      "${data.anlage}", "${data.uNr}", "${data.ausglbel}", "${data.ausgleich}"
    )`;
        pool.query(insertAnfrage, (err, results) => {
          if (err) {
            throw err;
          } else {
            console.log(i, "***** SAP-Buchung wurde eingefügt");
          }
        });

      })
  })
  res.json({ fileName: file.name, filePath: path });

});

// Upload SAP Buchungfile with Express
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.post("/SAPBasisKopfZeileSenden/:verfahrenId", function (req, res) {
  // File Upload **********
  if (req.files === null) {
    return res.status(400).json({ msg: "keine Datei wurde hochgeladen !" });
  }
  const file = req.files.file;
  const path = `./uploads/${file.name} `;

  file.mv(path)
    .then(() => {
      let temp = []
      temp = get_header_row(path)
      console.log(temp[0])
      res.json({ filename: file.name, header: temp[0] });
    })

});
router.post("/SAPkopfZeileSenden/:verfahrenId", function (req, res) {
  // File Upload **********
  if (req.files === null) {
    return res.status(400).json({ msg: "keine Datei wurde hochgeladen !" });
  }
  const file = req.files.file;
  const path = `./uploads/${file.name} `;

  file.mv(path).then(() => {
    let temp = []
    temp = get_header_row(path)
    console.log(temp[0])
    res.json({ filename: file.name, header: temp[0] });
  })

});

router.post("/SAPbasisFileUpload/:verfahrenId", function (req, res) {

  const verfahrenId = req.params.verfahrenId
  const filename = req.body.filename
  const path = `./uploads/${filename} `;
  const alleFelder = req.body.alleFelder
  const datenbankFelder = req.body.datenbankFelder
  const header = req.body.header
  let anfrage = "";

  const csv = require("csv-stream");
  let options = {
    delimiter: ';', // default is ,
    endLine: '\n', // default is \n,
    //  columnOffset: -1, // default is 0
    escapeChar: "µ", // default is an empty string
    enclosedChar: "µ", // default is an empty string
    columns: header
  }

  let csvStream = csv.createStream(options);

  fs.createReadStream(path).pipe(csvStream)
    .on('error', function (err) {
      console.log(err);
    })
    .on('data', function (data) {
      // outputs an object containing a set of key/value pair representing a line found in the csv file.
      let insertAnfrage = "";
      let temp = "";
      let temp1 = ""

      if (datenbankFelder.length === 1) {
        for (let i = 0; i <= datenbankFelder.length; i++) {
          datenbankFelder[i] = datenbankFelder[i].toString().toString().replace(/;/g, "").replace(/["']/g, '')
          if (i === 0) {
            temp = " INSERT INTO sap (datenQuelle, verfahrenId, " + datenbankFelder[i] + ' ) VALUES ( "sap" ,"'
          }
          else if (i === datenbankFelder.length) {
            temp = + verfahrenId + '", "'
          } else if (i !== 0 && i !== datenbankFelder.length - 1) {
            temp = datenbankFelder[i] + ","
          }
          insertAnfrage = insertAnfrage + temp

        }
      } else {

        for (let i = 0; i < datenbankFelder.length; i++) {
          datenbankFelder[i] = datenbankFelder[i].toString().toString().replace(/;/g, "").replace(/["']/g, '')
          if (datenbankFelder.length === 1) { }
          if (i === 0) {
            temp = " INSERT INTO sap (datenQuelle,verfahrenId," + datenbankFelder[i] + ','
          }
          else if (i === datenbankFelder.length - 1) {
            temp = datenbankFelder[i] + ' ) VALUES ( "sap" ,"' + verfahrenId + '","'
          } else if (i !== 0 && i !== datenbankFelder.length - 1) {
            temp = datenbankFelder[i] + ","
          }
          insertAnfrage = insertAnfrage + temp

        }
      }
      for (let i = 0; i < alleFelder.length; i++) {

        data[alleFelder[i]] = data[alleFelder[i]].toString().replace(/;/g, "").replace(/["';]/g, '')
        if (datenbankFelder[i] && (datenbankFelder[i] === "ausgleich" || datenbankFelder[i] === "buchdat" || datenbankFelder[i] === "belDatum" || datenbankFelder[i] === "nettoFaelligkeit")) {
          let str = data[alleFelder[i]];
          let isnum = /^\d+$/.test(str)
          let datum = str.slice(6, 8) + "." + str.slice(4, 6) + "." + str.slice(0, 4);

          if (isnum) {
            data[alleFelder[i]] = datum
          } else if (!isnum && datum && datum != "00.00.0000") {
            let datum = str.slice(0, 6) + "20" + str.slice(6, 8)
            data[alleFelder[i]] = datum
          }
        }
        if (datenbankFelder[i] === "betragHW" || datenbankFelder[i] === "betragTW" || datenbankFelder[i] === "skontoHW" || datenbankFelder[i] === "skontoTW") {
          data[alleFelder[i]] = Number(data[alleFelder[i]].replace(".", "").replace(",", "."))
          data[alleFelder[i]] = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(data[alleFelder[i]])
        }

        if (i === alleFelder.length - 1) {
          temp1 = data[alleFelder[i]] + '")'
        } else {
          temp1 = data[alleFelder[i]] + '","'
        }
        insertAnfrage = insertAnfrage + temp1




      }
      if (insertAnfrage) {
        anfrage = insertAnfrage

        pool.query(insertAnfrage, (err, results) => {
          if (err) {
            throw err;
          } else if (results) {
            if (results.affectedRows) {
              console.log(insertAnfrage)

            } else {
              console.log("Fehlgeschlagen");
            }
          }

        });
      }


    })


    .on('close', (data) => {
      // This may not been called since we are destroying the stream
      // the first time 'data' event is received
      console.log(data)

      if (anfrage) {
        console.log("ERfolgreich")
        res.json({ msg: "erfolgreich" });
      } else {
        console.log("fehlgeschlagen")
        res.json({ msg: "fehlgeschlagen" });
      }

    })
});
router.put("/SAPHilfsdateiUpload/:verfahrenId", function (req, res) {

  const verfahrenId = req.params.verfahrenId
  const filename = req.body.filename
  const path = `./uploads/${filename} `;
  const alleFelder = req.body.alleFelder
  const datenbankFelder = req.body.datenbankFelder
  const basisFelder = req.body.basisFelder
  const hilfsDateiFelder = req.body.hilfsDateiFelder

  console.log(alleFelder)
  console.log(datenbankFelder)
  console.log(basisFelder)
  console.log(hilfsDateiFelder)

  const header = req.body.header
  let anfrage = "";
  const csv = require("csv-stream");
  var options = {
    delimiter: ';', // default is ,
    endLine: '\n', // default is \n,
    columns: header,
    columnOffset: 7, // default is 0
    escapeChar: "*#$", // default is an empty string
    enclosedChar: "*#$" // default is an empty string
  }
  let csvStream = csv.createStream(options);
  fs.createReadStream(path).pipe(csvStream)
    .on('error', function (err) {
      console.log(err);
    })
    .on('data', function (data) {
      // outputs an object containing a set of key/value pair representing a line found in the csv file.


      let updateAnfrage = ""
      let temp = "";
      let temp1 = ""

      // UPDATE SET Anweisung
      for (let i = 0; i < datenbankFelder.length; i++) {
        if (datenbankFelder[i] === "betragHW" || datenbankFelder[i] === "betragTW" || datenbankFelder[i] === "skontoHW" || datenbankFelder[i] === "skontoTW") {
          data[alleFelder[i]] = Number(data[alleFelder[i]].replace(".", "").replace(",", "."))
          data[alleFelder[i]] = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(data[alleFelder[i]])
        }
        if (datenbankFelder[i] && data[alleFelder[i]]) {
          datenbankFelder[i] = datenbankFelder[i].toString().replace(/["']/g, '')
          data[alleFelder[i]] = data[alleFelder[i]].toString().replace(/["']/g, '')
          if (i === 0) {
            temp = "UPDATE sap SET " + datenbankFelder[i] + ' = "' + data[alleFelder[i]] + '"'
          }
          else if (i !== 0 && i === datenbankFelder.length - 1) {
            temp = ", " + datenbankFelder[i] + ' = "' + data[alleFelder[i]] + '"'
          } else if (i !== 0 && i !== datenbankFelder.length - 1) {
            temp = "," + datenbankFelder[i] + ' = "' + '' + data[alleFelder[i]] + '" '
          }
          updateAnfrage = updateAnfrage + temp
        } else if (datenbankFelder[i] && !data[alleFelder[i]]) {
          datenbankFelder[i] = datenbankFelder[i].toString().replace(/["']/g, '')
          if (i === 0) {
            temp = "UPDATE sap SET " + datenbankFelder[i] + ' = ""'
          }
          else if (i !== 0 && i === datenbankFelder.length - 1) {
            temp = ", " + datenbankFelder[i] + ' = ""'
          } else if (i !== 0 && i !== datenbankFelder.length - 1) {
            temp = "," + datenbankFelder[i] + ' = "" '
          }
          updateAnfrage = updateAnfrage + temp
        } else {
          updateAnfrage = ""
        }

      }

      // WHERE Anweisung
      if (updateAnfrage) {

        for (let i = 0; i < basisFelder.length; i++) {
          if (basisFelder[i] && data[hilfsDateiFelder[i]]) {
            basisFelder[i] = basisFelder[i].toString().replace(/["']/g, '')
            data[hilfsDateiFelder[i]] = data[hilfsDateiFelder[i]].toString().replace(/["']/g, '')
            if (i === 0 && basisFelder.length !== 1) {
              temp1 = " WHERE(verfahrenId=" + verfahrenId + " AND " + basisFelder[i] + " = '" + data[hilfsDateiFelder[i]] + "'";
            } else if (i === 0 && basisFelder.length === 1) {
              temp1 = " WHERE(verfahrenId=" + verfahrenId + " AND " + basisFelder[i] + " = '" + data[hilfsDateiFelder[i]] + "') ORDER BY " + basisFelder[i];
            }
            else if (i === basisFelder.length - 1) {
              if (i === 1) {
                temp1 = " AND " + basisFelder[i] + " = '" + data[hilfsDateiFelder[i]] + "' ) ORDER BY  " + basisFelder[i]
              }
              else {
                temp1 = basisFelder[i] + " = '" + data[hilfsDateiFelder[i]] + "' ) ORDER BY  " + basisFelder[i]
              }
            } else if (i !== 0 && i !== basisFelder.length - 1) {
              if (i === 1)
                temp1 = " AND " + basisFelder[i] + " = '" + data[hilfsDateiFelder[i]] + "' AND "
              else
                temp1 = basisFelder[i] + " = '" + data[hilfsDateiFelder[i]] + "' AND "
            }
            updateAnfrage = updateAnfrage + temp1

          } else {
            updateAnfrage = ""

          }

        }
      }
      if (updateAnfrage) {
        anfrage = updateAnfrage
        pool.query(updateAnfrage, (err, results) => {
          if (err) {
            console.log(err)
          } else {
            console.log(updateAnfrage);

          }
        });
      }

    })
    .on('close', (data) => {
      // This may not been called since we are destroying the stream
      // the first time 'data' event is received
      if (anfrage) {
        console.log("ERfolgreich")
        res.json({ msg: "erfolgreich" });
      } else {
        console.log("fehlgeschlagen")
        res.json({ msg: "fehlgeschlagen" });
      }
    })




});
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Upload SAP Buchungfile with Express
router.post("/SAPbuchungenUpload/:verfahrenId", function (req, res) {
  // File Upload **********
  if (req.files === null) {
    return res.status(400).json({ msg: "keine Datei wurde hochgeladen !" });
  }
  const file = req.files.file;
  const path = `./uploads/${file.name} `;
  file.mv(path, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }

    const csv = require("csv-stream");
    var options = {
      delimiter: ';', // default is ,
      endLine: '\n', // default is \n,
      columns: [
        'mdt',
        'buKr',
        'belegnr',
        'jahr1',
        'periode',
        'pos1',
        'bS',
        'koart',
        'sK',
        'hauptbuch',
        'gsBe',
        'partner',
        'sH',
        'betragTW',
        'betragHW',
        'hW2Betrag',
        'hW3Betrag',
        'skontoTW',
        'skontoHW',
        'skontoHW2',
        'skontoHW3',
        'zuordnung',
        'kreditor',
        'debitor',
        'steuerstandort',
        'bME',
        'menge',
        'kKrs',
        'pSPElement',
        '',
        'auftrag',
        'kostenst',
        'prctr',
        'werk',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        'anlage',
        'uNr',
        'ausglbel',
        'ausgleich',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        'text'

      ], // by default read the first line and use values found as columns
      columnOffset: 7, // default is 0
      escapeChar: '"', // default is an empty string
      enclosedChar: '"', // default is an empty string
      columns: []
    }

    var csvStream = csv.createStream(options);

    fs.createReadStream(path).pipe(csvStream)
      .on('error', function (err) {
        console.log(err);
      })
      .on('data', function (data) {
        // outputs an object containing a set of key/value pair representing a line found in the csv file.
        const formatter = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 })
        data.debitorname = ""
        data.kreditorname = ""
        if (formatter.format(parseFloat(data.skontoHW)).length > 7)
          data.skontoHW = formatter.format(parseFloat(data.skontoHW)).replace(".", ",").replace(",", ".")
        else
          data.skontoHW = formatter.format(parseFloat(data.skontoHW)).replace(".", ",")

        if (formatter.format(parseFloat(data.skontoTW)).length > 7)
          data.skontoTW = formatter.format(parseFloat(data.skontoTW)).replace(".", ",").replace(",", ".")
        else
          data.skontoTW = formatter.format(parseFloat(data.skontoTW)).replace(".", ",")

        if (formatter.format(parseFloat(data.betragTW)).length > 7)
          data.betragTW = formatter.format(parseFloat(data.betragTW)).replace(".", ",").replace(",", ".")
        else
          data.betragTW = formatter.format(parseFloat(data.betragTW)).replace(".", ",")

        if (formatter.format(parseFloat(data.betragHW)).length > 7)
          data.betragHW = formatter.format(parseFloat(data.betragHW)).replace(".", ",").replace(",", ".")
        else
          data.betragHW = formatter.format(parseFloat(data.betragHW)).replace(".", ",")

        insertAnfrage = ` INSERT INTO sap
              (
                datenQuelle, verfahrenId, mdt, buKr, belegnr, jahr1, periode, pos1,
                bS, koart, sK, hauptbuch, sH, betragTW, betragHW, hW2Betrag, hW3Betrag, skontoTW,
                skontoHW, skontoHW2, skontoHW3, zuordnung, kreditor, debitor, auftrag, kostenst, prctr, werk, 
                anlage, uNr, ausglbel, ausgleich, text
              )
            VALUES(
              "sap", "${req.params.verfahrenId}", "${data.mdt}", "${data.buKr}", "${data.belegnr}", "${data.jahr1}", "${data.periode}", "${data.pos1}",
              "${data.bS}", "${data.koart}", "${data.sK}", "${data.hauptbuch}", "${data.sH}", "${data.betragTW}", "${data.betragHW}", "${data.hW2Betrag}", "${data.hW3Betrag}", "${data.skontoTW}",
              "${data.skontoHW}", "${data.skontoHW2}", "${data.skontoHW3}", "${data.zuordnung}", "${data.kreditor}", "${data.debitor}", 
              "${data.auftrag}", "${data.kostenst}", "${data.prctr}", "${data.werk}", 
              "${data.anlage}", "${data.uNr}", "${data.ausglbel}", "${data.ausgleich}", "${data.text}"
            )`;

        pool.query(insertAnfrage, (err, results) => {
          console.log(data.belegnr, "*********uploaded*******");
        });


      })
  })
  res.send({ fileName: file.name });
});
// Upload SAP Buchungfile with Express
router.put("/SAPbuchungenUploadTest", function (req, res) {
  // File Upload **********
  if (req.files === null) {
    return res.status(400).json({ msg: "keine Datei wurde hochgeladen !" });
  }
  const file = req.files.file;
  const path = `./uploads/${file.name} `;

  file.mv(path, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  })



  const csv = require("csv-stream");
  var options = {
    delimiter: ';', // default is ,
    endLine: '\n', // default is \n,
    columns: [
      'mdt',
      'buKr',
      'belegnr',
      'jahr1',
      'periode',
      'pos1',
      'bS',
      'koart',
      'sK',
      'hauptbuch',
      'gsBe',
      'partner',
      'sH',
      'betragTW',
      'betragHW',
      'hW2Betrag',
      'hW3Betrag',
      'skontoTW',
      'skontoHW',
      'skontoHW2',
      'skontoHW3',
      'zuordnung',
      'kreditor',
      'debitor',
      'steuerstandort',
      'bME',
      'menge',
      'kKrs',
      'pSPElement',
      '',
      'auftrag',
      'kostenst',
      'prctr',
      'werk',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'anlage',
      'uNr',
      'ausglbel',
      'ausgleich'
    ], // by default read the first line and use values found as columns
    columnOffset: 7, // default is 0
    escapeChar: '"', // default is an empty string
    enclosedChar: '"' // default is an empty string
  }

  var csvStream = csv.createStream(options);

  fs.createReadStream(path).pipe(csvStream)
    .on('error', function (err) {
      console.log(err);
    })
    .on('data', function (data) {
      // outputs an object containing a set of key/value pair representing a line found in the csv file.
      const formatter = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 })
      data.debitorname = ""
      data.kreditorname = ""
      if (formatter.format(parseFloat(data.skontoHW)).length > 7)
        data.skontoHW = formatter.format(parseFloat(data.skontoHW)).replace(".", ",").replace(",", ".")
      else
        data.skontoHW = formatter.format(parseFloat(data.skontoHW)).replace(".", ",")

      if (formatter.format(parseFloat(data.skontoTW)).length > 7)
        data.skontoTW = formatter.format(parseFloat(data.skontoTW)).replace(".", ",").replace(",", ".")
      else
        data.skontoTW = formatter.format(parseFloat(data.skontoTW)).replace(".", ",")

      if (formatter.format(parseFloat(data.betragTW)).length > 7)
        data.betragTW = formatter.format(parseFloat(data.betragTW)).replace(".", ",").replace(",", ".")
      else
        data.betragTW = formatter.format(parseFloat(data.betragTW)).replace(".", ",")

      if (formatter.format(parseFloat(data.betragHW)).length > 7)
        data.betragHW = formatter.format(parseFloat(data.betragHW)).replace(".", ",").replace(",", ".")
      else
        data.betragHW = formatter.format(parseFloat(data.betragHW)).replace(".", ",")
      let anfrage = ` UPDATE sap SET
        auftrag  = "${data.auftrag}",
        kostenst ="${data.kostenst}",
        prctr    ="${data.prctr}",
        werk    ="${data.werk}",
        anlage    ="${data.anlage}",
        uNr    ="${data.uNr}",
        ausglbel    ="${data.ausglbel}",
        ausgleich    ="${data.ausgleich}"

        WHERE( verfahrenId = "${verfahrenId}"
               AND mdt = '${parseInt(data.mdt)}'
               AND buKr = '${data.bukr}'
               AND belegnr = "${data.belegnr}"
               AND periode = "${data.periode}"
               AND pos1 = "${data.pos1}"
               AND koart = "${data.koart}")
               AND hauptbuch = "${data.hauptbuch}")
               AND zuordnung = "${data.zuordnung}")
               AND kreditor = "${data.kreditor}")
               AND debitor = "${data.debitor}")
               AND jahr1 = "${data.jahr1}")
               AND bS = "${data.bS}")
               AND sK = "${data.sK}")
               AND sH = "${data.sH}")

            )
        ORDER BY id 
        `;
      /*       insertAnfrage = ` INSERT INTO sap
            (
              datenQuelle, verfahrenId, mdt, buKr, belegnr, jahr1, periode, pos1,
              bS, koart, sK, hauptbuch, sH, betragTW, betragHW, hW2Betrag, hW3Betrag, skontoTW,
              skontoHW, skontoHW2, skontoHW3, zuordnung, kreditor, debitor, auftrag, kostenst, prctr, werk, 
              anlage, uNr, ausglbel, ausgleich 
            )
          VALUES(
            "sap", "${verfahrenId}", "${data.mdt}", "${data.buKr}", "${data.belegnr}", "${data.jahr1}", "${data.periode}", "${data.pos1}",
            "${data.bS}", "${data.koart}", "${data.sK}", "${data.hauptbuch}", "${data.sH}", "${data.betragTW}", "${data.betragHW}", "${data.hW2Betrag}", "${data.hW3Betrag}", "${data.skontoTW}",
            "${data.skontoHW}", "${data.skontoHW2}", "${data.skontoHW3}", "${data.zuordnung}", "${data.kreditor}", "${data.debitor}", 
            "${data.auftrag}", "${data.kostenst}", "${data.prctr}", "${data.werk}", 
            "${data.anlage}", "${data.uNr}", "${data.ausglbel}", "${data.ausgleich}"
          )`; */

      pool.query(anfrage, (err, results) => {
        console.log(data.belegnr, "*********uploaded*******");
      });


    })
  res.json({ fileName: file.name, filePath: path });


});
// ****************************************************************************
// Upload SAP Buchungfile with Express
router.put("/SAPbuchungenHeadUpload/:verfahrenId", function (req, res) {
  // File Upload **********
  if (req.files === null) {
    return res.status(400).json({ msg: "keine Datei wurde hochgeladen !" });
  }
  const file = req.files.file;
  const path = `./uploads/${file.name} `;
  file.mv(path, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }
    const csv = require("csv-stream");
    var options = {
      delimiter: ';', // default is ,
      endLine: '\n', // default is \n,
      columns: [
        'mdt',
        'buKr',
        'belegnr',
        'jahr1',
        'periode1',
        'belegart',
        'buchdat',
        'belDatum',
        'uebergreifendeNr',
        'umrechDat',
        'referenz',
        'belegkopftext',
        'waehrg1'
      ], // by default read the first line and use values found as columns
      columnOffset: 7, // default is 0
      escapeChar: '"', // default is an empty string
      enclosedChar: '"' // default is an empty string
    }
    var csvStream = csv.createStream(options);
    fs.createReadStream(path).pipe(csvStream)
      .on('error', function (err) {
        console.log(err);
      })
      .on('data', function (data) {
        // outputs an object containing a set of key/value pair representing a line found in the csv file.

        Anfrage = ` UPDATE sap SET
                belegart = "${data.belegart}", buchdat = "${data.buchdat}", belDatum = "${data.belDatum}",
                uebergreifendeNr = "${data.uebergreifendeNr}", umrechDat = "${data.umrechDat}", referenz = "${data.referenz}" ,
                belegkopftext = "${data.belegkopftext}" ,waehrg1="${data.waehrg1}" 
                WHERE(verfahrenId="${req.params.verfahrenId}" AND mdt = "${data.mdt}" AND buKr = "${data.buKr}" AND belegnr = "${data.belegnr}" AND jahr1 = "${data.jahr1}")
                ORDER BY belegnr
                `;
        pool.query(Anfrage, (err, results) => {
          console.log("********* updated *****************");
        });

      })

  })


});
// *****************************************************************************
// Upload SAP kontenstammdaten
router.put("/SAPsachKontenStammUpload/:verfahrenId", function (req, res) {
  // File Upload **********
  if (req.files === null) {
    return res.status(400).json({ msg: "keine Datei wurde hochgeladen !" });
  }

  const file = req.files.file;
  const path = `./uploads/${file.name} `;

  file.mv(path, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }

    // ******************************************************

    let wb = XLSX.read(path, { type: "file" });
    let ws = wb.Sheets[wb.SheetNames[0]];
    XLSX.utils.sheet_add_aoa(ws, [[
      "mdt", "kontoNummer", "kontoName", "", "", "", "bukr"

    ]], {
      origin: "A1"
    });
    var result = XLSX.utils.sheet_to_json(wb.Sheets.Sheet1);

    for (i = 0; i < result.length; i++) {
      /*       if(result[i].kontoNummer) {
      
            }
            let selectAnfrage = ` SELECT FROM sap  
            WHERE ( verfahrenId = "${req.params.verfahrenId}" AND mdt = '${parseInt(result[i].mdt)}' AND buKr = '${result[i].bukr}'  AND hauptbuch LIKE '${"%" + result[i].kontoNummer}' )
            ORDER BY id 
            `;
            pool.query(selectAnfrage, (err, results) => {
      
              console.log( "********* updated *******");
      
      
            }); */

      let updateAnfrage = ` UPDATE sap SET
              kontoName = '${result[i].kontoName.toString().replace(/["']/g, '')}', kontoTyp = 'sachkonto'
              WHERE( verfahrenId = "${req.params.verfahrenId}" AND mdt = '${parseInt(result[i].mdt)}' AND buKr = '${result[i].bukr}'  AND hauptbuch LIKE '${"%" + result[i].kontoNummer}' )
              ORDER BY hauptbuch asc
              `;
      pool.query(updateAnfrage, (err, result) => {

        console.log("********* updated *******");


      });
    }
  });
  res.json({ fileName: file.name, filePath: path });
});
// *****************************************************************************
// Upload SAP Debitoren
router.put("/SAPdebitorenUpload/:verfahrenId", function (req, res) {
  // File Upload **********
  if (req.files === null) {
    return res.status(400).json({ msg: "keine Datei wurde hochgeladen !" });
  }
  const file = req.files.file;
  const path = `./uploads/${file.name}`;

  file.mv(path, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }
    // ******************************************************
    let wb = XLSX.read(path, { type: "file" });
    let ws = wb.Sheets[wb.SheetNames[0]];
    XLSX.utils.sheet_add_aoa(ws, [[
      "mdt", "bukr", "kontoNummer", "kontoName"

    ]], {
      origin: "A1"
    });
    var result = XLSX.utils.sheet_to_json(wb.Sheets.Sheet1);
    var temp = 0
    for (i = 0; i < result.length; i++) {
      temp = temp + 1
      let anfrage = ` UPDATE sap SET
               debitorname = '${result[i].kontoName.toString().replace(/["']/g, '')}', kontoTyp = 'debitor'
               WHERE ( verfahrenId = "${req.params.verfahrenId}"
                       AND mdt = '${parseInt(result[i].mdt)}' 
                       AND buKr = '${result[i].bukr}'  
                       AND debitor LIKE '${"%" + result[i].kontoNummer}' 
                       AND jahr1 = "${result[i].jahr1}"
                    )
               ORDER BY debitorname asc
   
               `;

      pool.query(anfrage, (err, results) => {

        console.log("********* updated *******");


      });
    }

    res.json({ fileName: file.name, filePath: path });
  });
});
// *****************************************************************************
// Upload SAP Kreditoren
router.put("/SAPkreditorenUpload/:verfahrenId", function (req, res) {
  // File Upload **********
  if (req.files === null) {
    return res.status(400).json({ msg: "keine Datei wurde hochgeladen !" });
  }
  const file = req.files.file;
  const path = `./uploads/${file.name}`;

  file.mv(path, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }


    // ***********************************************
    let wb = XLSX.read(path, { type: "file" });
    let ws = wb.Sheets[wb.SheetNames[0]];
    XLSX.utils.sheet_add_aoa(ws, [[
      "mdt", "bukr", "kontoNummer", "kontoName"

    ]], {
      origin: "A1"
    });
    var result = XLSX.utils.sheet_to_json(wb.Sheets.Sheet1);
    var temp = 0
    for (i = 0; i < result.length; i++) {
      temp = temp + 1
      let anfrage = ` UPDATE sap SET
              kreditorname = '${result[i].kontoName.toString().replace(/["']/g, '')}', kontoTyp = 'kreditor'
              WHERE( verfahrenId = "${req.params.verfahrenId}" AND mdt = '${parseInt(result[i].mdt)}' AND buKr = '${result[i].bukr}'  AND kreditor LIKE '${"%" + result[i].kontoNummer}' )
              ORDER BY kreditorname
              `;

      pool.query(anfrage, (err, results) => {

        console.log("********* updated *******");

      });
    }
  });
  res.json({ fileName: file.name, filePath: path });

});
// ****************************************************************************
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.post("/buchungenBasisKopfZeileSenden/:verfahrenId", function (req, res) {
  // File Upload **********
  if (req.files === null) {
    return res.status(400).json({ msg: "keine Datei wurde hochgeladen !" });
  }
  const file = req.files.file;
  const path = `./uploads/${file.name} `;
  const headers = [
    "id",
    "KontonummerdesKontos",
    "BelegdatumderBuchung",
    "BerichtigungsUmsatzsteuerschluessel",
    "KontonummerdesGegenkontos",
    "Buchungstext",
    "Kontobewegung_Steuersatz",
    "EU_Steuersatz",
    "Belegnummer",
    "Belegfeld 2",
    "UmsatzSoll",
    "UmsatzHaben",
    "",
    "",
    "Waehrungskennzeichen",
    "Umrechnungskurs",
    "Basiswaehrung",
    "Stapelnummer",
    "Buchungssatznummer",
    "Kost1Kostenstelle",
    "Kost2Kostenstelle",
    "KostMengenfeld",
    "KennungEbBuchung",
    "Buchungsperiode",
    "Buchungstyp",
    "Bearbeitungsstatus",
    "Belegpruefungsstatus",
    "Kontobewegungstyp",
    "",
    "",
    "AbwBesteuerungsart",
    "",
    "",
    "HauptfktTypSchl49",
    "HauptfktNrSchl49",
    "FktErgSchl49",
    "Herkunftskz",
    "Beleglink",
    "ArtderBeleginformation1",
    "InhaltderBeleginformation1",
    "ArtderBeleginformation2",
    "InhaltderBeleginformation2",
    "ArtderBeleginformation3",
    "InhaltderBeleginformation3",
    "ArtderBeleginformation4",
    "InhaltderBeleginformation4",
    "ArtderBeleginformation5",
    "InhaltderBeleginformation5",
    "ArtderBeleginformation6",
    "InhaltderBeleginformation6",
    "ArtderBeleginformation7",
    "InhaltderBeleginformation7",
    "ArtderBeleginformation8",
    "InhaltderBeleginformation8",
    "Stapelidentifikator",
    "Belegidentifikator",
    "",
    "",
    "",
    "",
    "Identifikationsnummer",
    "",
    "Leistungsdatum",
    ""
  ]
  file.mv(path)
    .then(() => {
      res.json({ filename: file.name, header: headers });
    })

});

router.put("/buchungenHelpFileKopfZeileSenden/:verfahrenId", function (req, res) {

  const verfahrenId = req.params.verfahrenId
  const filename = req.body.filename
  const path = `./uploads/${filename} `;
  const alleFelder = req.body.alleFelder
  const datenbankFelder = req.body.datenbankFelder
  const basisFelder = req.body.basisFelder
  const hilfsDateiFelder = req.body.hilfsDateiFelder
  const header = req.body.header
  let anfrage = "";

  const csv = require("csv-stream");
  var options = {
    delimiter: ';', // default is ,
    endLine: '\n', // default is \n,
    columns: header,
    columnOffset: 7, // default is 0
    escapeChar: "*#$", // default is an empty string
    enclosedChar: "*#$" // default is an empty string
  }
  let csvStream = csv.createStream(options);
  fs.createReadStream(path).pipe(csvStream)
    .on('error', function (err) {
      console.log(err);
    })
    .on('data', function (data) {
      // outputs an object containing a set of key/value pair representing a line found in the csv file.
      let updateAnfrage = ""
      let temp = "";
      let temp1 = ""
      for (let i = 0; i < datenbankFelder.length; i++) {
        if (datenbankFelder[i] && data[alleFelder[i]]) {
          if (i === 0) {
            temp = "UPDATE sap SET " + datenbankFelder[i] + ' = "' + data[alleFelder[i]] + '"'
          }
          else if (i === datenbankFelder.length - 1) {
            temp = ", " + datenbankFelder[i] + ' = "' + data[alleFelder[i]] + '"'
          } else if (i !== 0 && i !== datenbankFelder.length - 1) {
            temp = "," + datenbankFelder[i] + ' = "' + '' + data[alleFelder[i]] + '", '
          }
          updateAnfrage = updateAnfrage + temp
        }

      }
      if (updateAnfrage) {
        for (let i = 0; i < basisFelder.length; i++) {
          if (i === 0) {
            temp1 = " WHERE(verfahrenId=" + verfahrenId + " AND " + basisFelder[i] + " = " + data[hilfsDateiFelder[i]];
          } else if (i === basisFelder.length - 1) {
            if (i === 1)
              temp1 = " AND " + basisFelder[i] + " = " + data[hilfsDateiFelder[i]] + " ) ORDER BY id  "
            else
              temp1 = basisFelder[i] + " = " + data[hilfsDateiFelder[i]] + " ) ORDER BY id  "
          } else if (i !== 0 && i !== basisFelder.length - 1) {
            temp1 = " AND " + basisFelder[i] + " = " + data[hilfsDateiFelder[i]] + " AND "
          }
          updateAnfrage = updateAnfrage + temp1

        }
      }
      // console.log(updateAnfrage)
      if (updateAnfrage) {
        anfrage = updateAnfrage
        pool.query(updateAnfrage, (err, results) => {
          if (err) {
            console.log(err)
          } else {
            console.log(updateAnfrage);

          }
        });
      }

    })
    .on('close', (data) => {
      // This may not been called since we are destroying the stream
      // the first time 'data' event is received
      if (anfrage) {
        console.log("ERfolgreich")
        res.json({ msg: "erfolgreich" });
      } else {
        console.log("fehlgeschlagen")
        res.json({ msg: "fehlgeschlagen" });
      }
    })




});
router.post("/datevKontoBuchungUploadTest", function (req, res) {
  // File Upload **********
  if (req.files === null) {
    return res.status(400).json({ msg: "keine Datei wurde hochgeladen !" });
  }
  const file = req.files.file;
  const path = `./ uploads / ${file.name} `;
  // File in den Ordner anlegen
  file.mv(path, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }
    // Die erste Zeile von der Datei huinzufügen, weil die später durch die neue Header ersetzt wird
    // ******************************************************
    let header = get_header_row(path);
    let Kontonummer = header[0][1];
    let belegDatum = header[0][2];
    let umsatzSchluessel = header[0][3];
    let KontonummerdesGegenkontos = header[0][4];
    let buchungsText = header[0][5];
    let steuerSatz = header[0][6];
    let euSteuerSatz = header[0][7];
    let Belegnummer = header[0][8];
    let UmsatzSoll = header[0][10];
    let UmsatzHaben = header[0][11];
    let Waehrungskennzeichen = header[0][14];
    let Umrechnungskurs = header[0][15];
    let Basiswaehrung = header[0][16];
    let Stapelnummer = header[0][17];
    let Buchungssatznummer = header[0][18];
    let Kost1Kostenstelle = header[0][19];
    let Kost2Kostenstelle = header[0][20];
    let KennungEbBuchung = header[0][22];
    let Buchungsperiode = header[0][23];
    let Buchungstyp = header[0][24];
    let Bearbeitungsstatus = header[0][25];
    let Belegpruefungsstatus = header[0][26];
    let Kontobewegungstyp = header[0][27];
    let AbwBesteuerungsart = header[0][30];
    let HauptfktTypSchl49 = header[0][33];
    let HauptfktNrSchl49 = header[0][34];
    let FktErgSchl49 = header[0][35];
    let Herkunftskz = header[0][36];
    let Beleglink = header[0][37];
    let Stapelidentifikator = header[0][54];
    let Belegidentifikator = header[0][55];
    let Identifikationsnummer = header[0][60];
    let Leistungsdatum = header[0][62];



    insertAnfrage = ` INSERT INTO buchungen
      (
        datenQuelle, verfahrenId, geschaeftsJahr, kontoNummer, gegenkontoNummer, belegDatum, umsatzSteuerSchluessel,
        buchungsText, steuerSatz, euSteuerSatz, belegNummer, umsatzSoll, umsatzHaben, saldo,
        waehrungsKennzeichen, umrechnungsKurs, basisWaehrung,
        stapelNummer, buchungsSatzNummer, kost1Kostenstelle, kost2Kostenstelle,
        kennungEbBuchung, buchungsperiode, abweichendeBesteuerungsart, belegLink,
        identifikationsNummer, leistungsDatum, artDerBelegInformation1, inhaltDerBelegInformation1,
        artDerBelegInformation2, inhaltDerBelegInformation2, artDerBelegInformation3,
        inhaltDerBelegInformation3, artDerBelegInformation4, inhaltDerBelegInformation4,
        artDerBelegInformation5, inhaltDerBelegInformation5, artDerBelegInformation6, inhaltDerBelegInformation6,
        artDerBelegInformation7, inhaltDerBelegInformation7, artDerBelegInformation8, inhaltDerBelegInformation8,
        artDerBelegInformation9, inhaltDerBelegInformation9, artDerBelegInformation10, inhaltDerBelegInformation10
      )
    VALUES(
      "datev", "${verfahrenId}", "${geschaeftsJahr}", "${Kontonummer}",
      "${belegDatum}", "${umsatzSchluessel.toLocaleString('de-DE')}",
      "${KontonummerdesGegenkontos}", "${buchungsText}",
      "${steuerSatz}", "${euSteuerSatz}", "${Belegnummer}",
      "${new Intl.NumberFormat("de - DE", { style: "currency", currency: "EUR" }).format(parseFloat(UmsatzSoll))}",
      "${new Intl.NumberFormat("de - DE", { style: "currency", currency: "EUR" }).format(parseFloat(UmsatzHaben))}",
      "${new Intl.NumberFormat("de - DE", { style: "currency", currency: "EUR" }).format(parseFloat(UmsatzSoll) - parseFloat(UmsatzHaben))}",
      "${Waehrungskennzeichen}", "${Umrechnungskurs}", "${Basiswaehrung}",
      "${Stapelnummer}", "${Buchungssatznummer}", "${Kost1Kostenstelle}",
      "${Kost2Kostenstelle}", "${KennungEbBuchung}", "${Buchungsperiode}",
      "${AbwBesteuerungsart}", "${Beleglink}", "${Identifikationsnummer}",
      "${Leistungsdatum}", "Buchungstyp", "${Buchungstyp}", "Bearbeitungstatus",
      "${Bearbeitungsstatus}", "Belegpruefungsstatus", "${Belegpruefungsstatus}",
      "Kontobewegungstyp", "${Kontobewegungstyp}", "Hauptfunktionstyp Steuerschluessel 49",
      "${HauptfktTypSchl49}", "HauptfunktionsnummerSteuerschluessel 49", "${HauptfktNrSchl49}",
      "Funktionsergaenzung Steuerschluessel 49", "${FktErgSchl49}", "Herkunftskennzeichen",
      "${Herkunftskz}", "Stapelidentifikator", "${Stapelidentifikator}", "Belegidentifikator",
      "${Belegidentifikator}"
    )`;

    pool.query(insertAnfrage, (err, results) => {
      if (err) {
        throw err;
      } else {
        console.log(" Eine DatevBuchung  wurde eingefügt");
      }
    });

    // ******************************************************

    let wb = XLSX.read(path, { type: "file" });
    let ws = wb.Sheets[wb.SheetNames[0]];
    XLSX.utils.sheet_add_aoa(ws, [[
      "id",
      "KontonummerdesKontos",
      "BelegdatumderBuchung",
      "BerichtigungsUmsatzsteuerschluessel",
      "KontonummerdesGegenkontos",
      "Buchungstext",
      "Kontobewegung_Steuersatz",
      "EU_Steuersatz",
      "Belegnummer",
      "Belegfeld 2",
      "UmsatzSoll",
      "UmsatzHaben",
      "",
      "",
      "Waehrungskennzeichen",
      "Umrechnungskurs",
      "Basiswaehrung",
      "Stapelnummer",
      "Buchungssatznummer",
      "Kost1Kostenstelle",
      "Kost2Kostenstelle",
      "KostMengenfeld",
      "KennungEbBuchung",
      "Buchungsperiode",
      "Buchungstyp",
      "Bearbeitungsstatus",
      "Belegpruefungsstatus",
      "Kontobewegungstyp",
      "",
      "",
      "AbwBesteuerungsart",
      "",
      "",
      "HauptfktTypSchl49",
      "HauptfktNrSchl49",
      "FktErgSchl49",
      "Herkunftskz",
      "Beleglink",
      "ArtderBeleginformation1",
      "InhaltderBeleginformation1",
      "ArtderBeleginformation2",
      "InhaltderBeleginformation2",
      "ArtderBeleginformation3",
      "InhaltderBeleginformation3",
      "ArtderBeleginformation4",
      "InhaltderBeleginformation4",
      "ArtderBeleginformation5",
      "InhaltderBeleginformation5",
      "ArtderBeleginformation6",
      "InhaltderBeleginformation6",
      "ArtderBeleginformation7",
      "InhaltderBeleginformation7",
      "ArtderBeleginformation8",
      "InhaltderBeleginformation8",
      "Stapelidentifikator",
      "Belegidentifikator",
      "",
      "",
      "",
      "",
      "Identifikationsnummer",
      "",
      "Leistungsdatum",
      ""
    ]], {
      origin: "A1"
    });
    var result = XLSX.utils.sheet_to_json(wb.Sheets.Sheet1);
    for (i = 0; i < result.length; i++) {
      insertAnfrage = ` INSERT INTO buchungen
      (
        datenQuelle, verfahrenId, geschaeftsJahr, kontoNummer, gegenkontoNummer, belegDatum, umsatzSteuerSchluessel,
        buchungsText, steuerSatz, euSteuerSatz, belegNummer, umsatzSoll, umsatzHaben, saldo,
        waehrungsKennzeichen, umrechnungsKurs, basisWaehrung,
        stapelNummer, buchungsSatzNummer, kost1Kostenstelle, kost2Kostenstelle,
        kennungEbBuchung, buchungsperiode, abweichendeBesteuerungsart, belegLink,
        identifikationsNummer, leistungsDatum, artDerBelegInformation1, inhaltDerBelegInformation1,
        artDerBelegInformation2, inhaltDerBelegInformation2, artDerBelegInformation3,
        inhaltDerBelegInformation3, artDerBelegInformation4, inhaltDerBelegInformation4,
        artDerBelegInformation5, inhaltDerBelegInformation5, artDerBelegInformation6, inhaltDerBelegInformation6,
        artDerBelegInformation7, inhaltDerBelegInformation7, artDerBelegInformation8, inhaltDerBelegInformation8,
        artDerBelegInformation9, inhaltDerBelegInformation9, artDerBelegInformation10, inhaltDerBelegInformation10
      )
    VALUES(
      "datev", "${verfahrenId}", "${geschaeftsJahr}", "${result[i].KontonummerdesKontos}",
      "${result[i].KontonummerdesGegenkontos}", "${result[i].BelegdatumderBuchung.toLocaleString('de-DE')}",
      "${result[i].BerichtigungsUmsatzsteuerschluessel}", "${result[i].Buchungstext}",
      "${result[i].Kontobewegung_Steuersatz}", "${result[i].EU_Steuersatz}", "${result[i].Belegnummer}",
      "${new Intl.NumberFormat("de - DE", { style: "currency", currency: "EUR" }).format(parseFloat(result[i].UmsatzSoll))}",
      "${new Intl.NumberFormat("de - DE", { style: "currency", currency: "EUR" }).format(parseFloat(result[i].UmsatzHaben))}",
      "${new Intl.NumberFormat("de - DE", { style: "currency", currency: "EUR" }).format(parseFloat(result[i].UmsatzSoll) - parseFloat(result[i].UmsatzHaben))}",
      "${result[i].Waehrungskennzeichen}", "${result[i].Umrechnungskurs}", "${result[i].Basiswaehrung}",
      "${result[i].Stapelnummer}", "${result[i].Buchungssatznummer}", "${result[i].Kost1Kostenstelle}",
      "${result[i].Kost2Kostenstelle}", "${result[i].KennungEbBuchung}", "${result[i].Buchungsperiode}",
      "${result[i].AbwBesteuerungsart}", "${result[i].Beleglink}", "${result[i].Identifikationsnummer}",
      "${result[i].Leistungsdatum}", "Buchungstyp", "${result[i].Buchungstyp}", "Bearbeitungstatus",
      "${result[i].Bearbeitungsstatus}", "Belegpruefungsstatus", "${result[i].Belegpruefungsstatus}",
      "Kontobewegungstyp", "${result[i].Kontobewegungstyp}", "Hauptfunktionstyp Steuerschluessel 49",
      "${result[i].HauptfktTypSchl49}", "HauptfunktionsnummerSteuerschluessel 49", "${result[i].HauptfktNrSchl49}",
      "Funktionsergaenzung Steuerschluessel 49", "${result[i].FktErgSchl49}", "Herkunftskennzeichen",
      "${result[i].Herkunftskz}", "Stapelidentifikator", "${result[i].Stapelidentifikator}", "Belegidentifikator",
      "${result[i].Belegidentifikator}"

    )`;

      pool.query(insertAnfrage, (err, results) => {
        if (err) {
          throw err;
        } else {
          console.log(" Eine DatevBuchung  wurde eingefügt");
        }
      });
    }


    res.json({ fileName: file.name, filePath: path });
  });
});
// ****************************************************************************
// Upload a Datev file with Express
router.post("/datevKontoBuchungUploadALT", function (req, res) {
  // File Upload **********
  if (req.files === null) {
    return res.status(400).json({ msg: "keine Datei wurde hochgeladen !" });
  }
  const file = req.files.file;

  const path = `./uploads/${file.name} `;
  const csvtojson = require("csvtojson");

  // File in den Ordner anlegen und Callback Funktion aufrufen
  file.mv(path, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    } else {
      csvtojson({
        noheader: true,
        headers: [
          "id",
          "KontonummerdesKontos",
          "BelegdatumderBuchung",
          "BerichtigungsUmsatzsteuerschluessel",
          "KontonummerdesGegenkontos",
          "Buchungstext",
          "Kontobewegung_Steuersatz",
          "EU_Steuersatz",
          "Belegnummer",
          "Belegfeld 2",
          "UmsatzSoll",
          "UmsatzHaben",
          "",
          "",
          "Waehrungskennzeichen",
          "Umrechnungskurs",
          "Basiswaehrung",
          "Stapelnummer",
          "Buchungssatznummer",
          "Kost1Kostenstelle",
          "Kost2Kostenstelle",
          "KostMengenfeld",
          "KennungEbBuchung",
          "Buchungsperiode",
          "Buchungstyp",
          "Bearbeitungsstatus",
          "Belegpruefungsstatus",
          "Kontobewegungstyp",
          "",
          "",
          "AbwBesteuerungsart",
          "",
          "",
          "HauptfktTypSchl49",
          "HauptfktNrSchl49",
          "FktErgSchl49",
          "Herkunftskz",
          "Beleglink",
          "ArtderBeleginformation1",
          "InhaltderBeleginformation1",
          "ArtderBeleginformation2",
          "InhaltderBeleginformation2",
          "ArtderBeleginformation3",
          "InhaltderBeleginformation3",
          "ArtderBeleginformation4",
          "InhaltderBeleginformation4",
          "ArtderBeleginformation5",
          "InhaltderBeleginformation5",
          "ArtderBeleginformation6",
          "InhaltderBeleginformation6",
          "ArtderBeleginformation7",
          "InhaltderBeleginformation7",
          "ArtderBeleginformation8",
          "InhaltderBeleginformation8",
          "Stapelidentifikator",
          "Belegidentifikator",
          "",
          "",
          "",
          "",
          "Identifikationsnummer",
          "",
          "Leistungsdatum",
          ""
        ],
        delimiter: [";"]
      }).fromFile(path).then(source => {

        source.map(buchung => {

          insertAnfrage = ` INSERT INTO buchungen
      (
        datenQuelle, verfahrenId, geschaeftsJahr, kontoNummer, gegenkontoNummer, belegDatum, umsatzSteuerSchluessel,
        buchungsText, steuerSatz, euSteuerSatz, belegNummer, umsatzSoll, umsatzHaben, saldo,
        waehrungsKennzeichen, umrechnungsKurs, basisWaehrung,
        stapelNummer, buchungsSatzNummer, kost1Kostenstelle, kost2Kostenstelle,
        kennungEbBuchung, buchungsperiode, abweichendeBesteuerungsart, Beleglink,
        Identifikationsnummer, Leistungsdatum, artDerBelegInformation1, inhaltDerBelegInformation1,
        artDerBelegInformation2, inhaltDerBelegInformation2, artDerBelegInformation3,
        inhaltDerBelegInformation3, artDerBelegInformation4, inhaltDerBelegInformation4,
        artDerBelegInformation5, inhaltDerBelegInformation5, artDerBelegInformation6, inhaltDerBelegInformation6,
        artDerBelegInformation7, inhaltDerBelegInformation7, artDerBelegInformation8, inhaltDerBelegInformation8,
        artDerBelegInformation9, inhaltDerBelegInformation9, artDerBelegInformation10, inhaltDerBelegInformation10
      )
    VALUES(
      "datev", "${verfahrenId}", "${geschaeftsJahr}", "${buchung.KontonummerdesKontos}",
      "${buchung.KontonummerdesGegenkontos}", "${buchung.BelegdatumderBuchung.toLocaleString('de-DE')}",
      "${buchung.BerichtigungsUmsatzsteuerschluessel}", "${buchung.Buchungstext}",
      "${buchung.Kontobewegung_Steuersatz}", "${buchung.EU_Steuersatz}", "${buchung.Belegnummer}",
      "${buchung.UmsatzSoll}",
      "${buchung.UmsatzHaben}",
      "${ (buchung.UmsatzSoll.toString().replace(",", ".") - buchung.UmsatzHaben.toString().replace(",", ".")).toString().replace(".", ",")}",
      "${buchung.Waehrungskennzeichen}", "${buchung.Umrechnungskurs}", "${buchung.Basiswaehrung}",
      "${buchung.Stapelnummer}", "${buchung.Buchungssatznummer}", "${buchung.Kost1Kostenstelle}",
      "${buchung.Kost2Kostenstelle}", "${buchung.KennungEbBuchung}", "${buchung.Buchungsperiode}",
      "${buchung.AbwBesteuerungsart}", "${buchung.Beleglink}", "${buchung.Identifikationsnummer}",
      "${buchung.Leistungsdatum}", "Buchungstyp", "${buchung.Buchungstyp}", "Bearbeitungstatus",
      "${buchung.Bearbeitungsstatus}", "Belegpruefungsstatus", "${buchung.Belegpruefungsstatus}",
      "Kontobewegungstyp", "${buchung.Kontobewegungstyp}", "Hauptfunktionstyp Steuerschluessel 49",
      "${buchung.HauptfktTypSchl49}", "HauptfunktionsnummerSteuerschluessel 49", "${buchung.HauptfktNrSchl49}",
      "Funktionsergaenzung Steuerschluessel 49", "${buchung.FktErgSchl49}", "Herkunftskennzeichen",
      "${buchung.Herkunftskz}", "Stapelidentifikator", "${buchung.Stapelidentifikator}", "Belegidentifikator",
      "${buchung.Belegidentifikator}"

    )`;

          pool.query(insertAnfrage, (err, results) => {
            if (err) {
              throw err;
            } else {
              console.log(" Eine DatevBuchung  wurde eingefügt");
            }
          });
        })
      })
    }
  });


  res.json({ fileName: file.name, filePath: path });

});
// Upload a Datev file with Express
router.post("/datevKontoBuchungUpload/:verfahrenId/:year", function (req, res) {
  // File Upload **********
  if (req.files.file === null) {
    return res.status(400).json({ msg: "keine Datei wurde hochgeladen !" });
  }
  const file = req.files.file
  const geschaeftsJahr = req.params.year
  const verfahrenId = req.params.verfahrenId
  const path = `./uploads/${file.name} `;
  const headers = [
    "id",
    "KontonummerdesKontos",
    "BelegdatumderBuchung",
    "BerichtigungsUmsatzsteuerschluessel",
    "KontonummerdesGegenkontos",
    "Buchungstext",
    "Kontobewegung_Steuersatz",
    "EU_Steuersatz",
    "Belegnummer",
    "Belegfeld 2",
    "UmsatzSoll",
    "UmsatzHaben",
    "",
    "",
    "Waehrungskennzeichen",
    "Umrechnungskurs",
    "Basiswaehrung",
    "Stapelnummer",
    "Buchungssatznummer",
    "Kost1Kostenstelle",
    "Kost2Kostenstelle",
    "KostMengenfeld",
    "KennungEbBuchung",
    "Buchungsperiode",
    "Buchungstyp",
    "Bearbeitungsstatus",
    "Belegpruefungsstatus",
    "Kontobewegungstyp",
    "",
    "",
    "AbwBesteuerungsart",
    "",
    "",
    "HauptfktTypSchl49",
    "HauptfktNrSchl49",
    "FktErgSchl49",
    "Herkunftskz",
    "Beleglink",
    "ArtderBeleginformation1",
    "InhaltderBeleginformation1",
    "ArtderBeleginformation2",
    "InhaltderBeleginformation2",
    "ArtderBeleginformation3",
    "InhaltderBeleginformation3",
    "ArtderBeleginformation4",
    "InhaltderBeleginformation4",
    "ArtderBeleginformation5",
    "InhaltderBeleginformation5",
    "ArtderBeleginformation6",
    "InhaltderBeleginformation6",
    "ArtderBeleginformation7",
    "InhaltderBeleginformation7",
    "ArtderBeleginformation8",
    "InhaltderBeleginformation8",
    "Stapelidentifikator",
    "Belegidentifikator",
    "",
    "",
    "",
    "",
    "Identifikationsnummer",
    "",
    "Leistungsdatum",
    ""
  ]
  const filename = req.files.file.name
  const csvtojson = require("csvtojson");
  // File in den Ordner anlegen und Callback Funktion aufrufen
  file.mv(path, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    } else {
      csvtojson({
        noheader: true,
        headers: headers,
        delimiter: [";"]
      }).fromFile(path)
        .then((source, anfrage) => {


          source.map((buchung, index) => {

            if (buchung.KontonummerdesKontos) {

              let saldo = parseFloat(buchung.UmsatzSoll.toString().replace(".", "").replace(",", ".")) - parseFloat(buchung.UmsatzHaben.toString().replace(".", "").replace(",", "."));
              let insertAnfrage = ` INSERT INTO buchungen
        (
          datenQuelle, verfahrenId, geschaeftsJahr, kontoNummer, gegenkontoNummer, belegDatum, umsatzSteuerSchluessel,
          buchungsText, steuerSatz, euSteuerSatz, belegNummer, umsatzSoll, umsatzHaben, saldo,
          waehrungsKennzeichen, umrechnungsKurs, basisWaehrung,
          stapelNummer, buchungsSatzNummer, kost1Kostenstelle, kost2Kostenstelle,
          kennungEbBuchung, buchungsperiode, abweichendeBesteuerungsart, Beleglink,
          Identifikationsnummer, Leistungsdatum, artDerBelegInformation1, inhaltDerBelegInformation1,
          artDerBelegInformation2, inhaltDerBelegInformation2, artDerBelegInformation3,
          inhaltDerBelegInformation3, artDerBelegInformation4, inhaltDerBelegInformation4,
          artDerBelegInformation5, inhaltDerBelegInformation5, artDerBelegInformation6, inhaltDerBelegInformation6,
          artDerBelegInformation7, inhaltDerBelegInformation7, artDerBelegInformation8, inhaltDerBelegInformation8,
          artDerBelegInformation9, inhaltDerBelegInformation9, artDerBelegInformation10, inhaltDerBelegInformation10
        )
      VALUES(
        "datev", "${verfahrenId}", "${geschaeftsJahr}", "${buchung.KontonummerdesKontos}",
        "${buchung.KontonummerdesGegenkontos}", "${buchung.BelegdatumderBuchung.toLocaleString('de-DE')}",
        "${buchung.BerichtigungsUmsatzsteuerschluessel}", "${buchung.Buchungstext}",
        "${buchung.Kontobewegung_Steuersatz}", "${buchung.EU_Steuersatz}", "${buchung.Belegnummer}",
        "${buchung.UmsatzSoll}",
        "${buchung.UmsatzHaben}",
        "${ saldo}",
        "${buchung.Waehrungskennzeichen}", "${buchung.Umrechnungskurs}", "${buchung.Basiswaehrung}",
        "${buchung.Stapelnummer}", "${buchung.Buchungssatznummer}", "${buchung.Kost1Kostenstelle}",
        "${buchung.Kost2Kostenstelle}", "${buchung.KennungEbBuchung}", "${buchung.Buchungsperiode}",
        "${buchung.AbwBesteuerungsart}", "${buchung.Beleglink}", "${buchung.Identifikationsnummer}",
        "${buchung.Leistungsdatum}", "Buchungstyp", "${buchung.Buchungstyp}", "Bearbeitungstatus",
        "${buchung.Bearbeitungsstatus}", "Belegpruefungsstatus", "${buchung.Belegpruefungsstatus}",
        "Kontobewegungstyp", "${buchung.Kontobewegungstyp}", "Hauptfunktionstyp Steuerschluessel 49",
        "${buchung.HauptfktTypSchl49}", "HauptfunktionsnummerSteuerschluessel 49", "${buchung.HauptfktNrSchl49}",
        "Funktionsergaenzung Steuerschluessel 49", "${buchung.FktErgSchl49}", "Herkunftskennzeichen",
        "${buchung.Herkunftskz}", "Stapelidentifikator", "${buchung.Stapelidentifikator}", "Belegidentifikator",
        "${buchung.Belegidentifikator}"
  
      )`;

              if (insertAnfrage) {
                pool.query(insertAnfrage, (err, results) => {
                  if (err) {
                    throw err;
                    res.json({ filename: filename, msg: "fehlgeschlagen" });
                  } else if (results) {
                    if (results.affectedRows) {
                      console.log("insertAnfrage: ", index)
                    } else {
                      console.log("Fehlgeschlagen");
                    }
                  }

                });
              }
            }

          })
        })

    }
  })
  res.json({ filename: filename, msg: "erfolgreich" });

});


// ****************************************************************************
// Upload Lexware file with Express
router.post("/lexwareKontoBuchungenUpload/:verfahrenId/:year", function (req, res) {
  // File Upload **********
  if (req.files === null) {
    return res.status(400).json({ msg: "keine Datei wurde hochgeladen !" });
  }
  const file = req.files.file;
  const filename = req.files.file.name;
  const path = `./uploads/${filename}`;
  const verfahrenId = req.params.verfahrenId
  const year = req.params.year

  file.mv(path, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }

    const csvtojson = require("csvtojson");
    csvtojson({
      noheader: false,
      headers: [
        'Buchungsnummer',
        'Buchungsdatum',
        'Journaldatum',
        'Belegdatum',
        'Belegnummer',
        'Buchungstext',
        'Buchungsbetrag',
        'Sollkonto',
        'Sollbetrag',
        'Habenkonto',
        'Habenbetrag',
        'UStKontoSoll',
        'UStBetragSoll',
        'UStKontoHaben',
        'UStBetragHaben',
        'KSt1',
        'KSt2'
      ],
      delimiter: ["\t"]
    })
      .fromFile(path).then(source => {
        source.map(buchung => {


          insertAnfrage1 = ` INSERT INTO buchungen 
                           (
                           datenQuelle, verfahrenId, geschaeftsJahr, kontoNummer, belegDatum, gegenkontoNummer,
                           buchungsText, steuerBetrag, belegNummer, buchungsBetrag,umsatzSoll,
                           buchungsSatzNummer,	kost1Kostenstelle, 	kost2Kostenstelle,
                           artDerBelegInformation1, inhaltDerBelegInformation1, artDerBelegInformation2,
                           inhaltDerBelegInformation2, artDerBelegInformation3, inhaltDerBelegInformation3,
                           artDerBelegInformation4, inhaltDerBelegInformation4
                          ) 
                         VALUES  (
                            "lexware", "${verfahrenId}","${year}", "${buchung.Sollkonto}" ,"${buchung.Belegdatum}","${buchung.Habenkonto}",
                            "${buchung.Buchungstext}", "${(buchung.UStBetragSoll.toString().replace(".", "").replace(",", ".") - buchung.UStBetragHaben.toString().replace(".", "").replace(",", ".")).toString().replace(".", ",")}", 
                            "${buchung.Belegnummer}","${buchung.Buchungsbetrag}",
                            "${ buchung.Sollbetrag}","${buchung.Buchungsnummer}", 
                            "${buchung.KSt1}" ,"${buchung.KSt2}","Buchungsdatum", "${buchung.Buchungsdatum}", "Journaldatum", "${buchung.Journaldatum.toLocaleString('de-DE')}",
                            "USt-Konto Soll","${buchung.UStKontoSoll}", "USt-Konto Haben", "${buchung.UStKontoHaben}"
                          ) `;
          insertAnfrage2 = ` INSERT INTO buchungen 
                          (
                          datenQuelle, verfahrenId, geschaeftsJahr, kontoNummer, belegDatum, gegenkontoNummer,
                          buchungsText, steuerBetrag, belegNummer, buchungsBetrag,
                          umsatzHaben, 	buchungsSatzNummer,	kost1Kostenstelle, 	kost2Kostenstelle,
                          artDerBelegInformation1, inhaltDerBelegInformation1, artDerBelegInformation2,
                          inhaltDerBelegInformation2, artDerBelegInformation3, inhaltDerBelegInformation3,
                          artDerBelegInformation4, inhaltDerBelegInformation4
                         ) 
                        VALUES  (
                         "lexware", "${verfahrenId}","${year}", "${buchung.Habenkonto}" ,"${buchung.Belegdatum.toLocaleString('de-DE')}","${buchung.Sollkonto}",
                         "${buchung.Buchungstext}",  "${(buchung.UStBetragSoll.toString().replace(".", "").replace(",", ".") - buchung.UStBetragHaben.toString().replace(".", "").replace(",", ".")).toString().replace(".", ",")}", 
                         "${buchung.Belegnummer}",
                         "${buchung.Buchungsbetrag}","${buchung.Habenbetrag}",
                         "${buchung.Buchungsnummer}", "${buchung.KSt1}" ,"${buchung.KSt2}",
                         "Buchungsdatum", "${buchung.Buchungsdatum.toLocaleString('de-DE')}", "Journaldatum", "${buchung.Journaldatum.toLocaleString('de-DE')}", "USt-Konto Soll",
                         "${buchung.UStKontoSoll}", "USt-Konto Haben", "${buchung.UStKontoHaben}"
                         ) `;

          pool.query(insertAnfrage1, (err, results) => {
            if (err) {
              throw err;
              res.json({ filename: filename, msg: "fehlgeschlagen" });

            } else if (results) {
              if (results.affectedRows) {
                console.log(insertAnfrage1)
              } else {
                console.log("Fehlgeschlagen");
              }
            }
          });
          pool.query(insertAnfrage2, (err, results) => {
            if (err) {
              throw err;
            } else if (results) {
              if (results.affectedRows) {
                console.log(insertAnfrage2)
              } else {
                console.log("Fehlgeschlagen");
              }
            }
          });
        })
      })
  })
  res.json({ filename: filename, msg: "erfolgreich" });
});
// ****************************************************************************
router.put("/lexwareSachKontenStammUpload/:verfahrenId", function (req, res) {
  // File Upload **********
  if (req.files === null) {
    return res.status(400).json({ msg: "keine Datei wurde hochgeladen !" });
  }
  const verfahrenId = req.params.verfahrenId
  const file = req.files.file;
  const path = `./uploads/${file.name}`;

  file.mv(path, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }

    var wb = XLSX.read(path, { type: "file" });
    var ws = wb.Sheets[wb.SheetNames[0]];
    XLSX.utils.sheet_add_aoa(ws, [["kontonummer", "kontoname"]], {
      origin: "A1"
    });

    var result = XLSX.utils.sheet_to_json(wb.Sheets.Sheet1);

    for (i = 0; i < result.length; i++) {

      anfrage1 = ` UPDATE buchungen  SET
        kontoBeschriftung = '${result[i].kontoname}'
        WHERE(verfahrenId= "${verfahrenId}" AND kontoNummer = "${result[i].kontonummer}" )
        ORDER BY id 
        `;
      anfrage2 = ` UPDATE buchungen  SET
        gegenkontoBeschriftung = '${result[i].kontoname.toString().replace(/["']/g, '')}' 
        WHERE (verfahrenId= "${verfahrenId}" AND gegenkontoNummer = "${result[i].kontonummer}" )
        ORDER BY id 
        `;
      pool.query(anfrage1, (err, results) => {
        if (err) {
          res.json({ filename: filename, msg: "fehlgeschlagen" });
        } else if (results) {
          if (results.affectedRows) {
            console.log(anfrage1)
          }
        }
      });
      pool.query(anfrage2, (err, results) => {
        if (err) {
          throw err;
          res.json({ filename: filename, msg: "fehlgeschlagen" });
        } else if (results) {
          if (results.affectedRows) {
            console.log(anfrage2)
          }
        }
      });
    }

    res.json({ filename: file.name, msg: "erfolgreich" });
  });

});
// Get the first row of the Excel 

function get_header_row(path) {
  let workbook = XLSX.readFile(path, { sheetRows: 1 });
  let sheetsList = workbook.SheetNames
  let sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetsList[0]], {
    header: 1,
    defval: '',
    blankrows: true
  });
  return sheetData;
}
// ****************************************************************************
/* router.post("/datevSachKontenStammUploadALT", function (req, res) {
  // File Upload **********
  if (req.files === null) {
    return res.status(400).json({ msg: "keine Datei wurde hochgeladen !" });
  }
  const file = req.files.file;
  const path = `./uploads/${file.name}`;
  // File in den Ordner anlegen
  file.mv(path, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }
    // Die erste Zeile von der Datei huinzufügen, weil die später durch die neue Header ersetzt wird
    // ******************************************************
    let header = get_header_row(path);
    let fehlendeKontonummer = header[0][0];
    let fehlenderKontoBeschriftung = header[0][1];
    insertAnfrage1 = ` INSERT INTO kontenstammdaten 
                      ( verfahrenId, kontoNummer, kontoName) 
                      VALUES  ( "${verfahrenId}", "${fehlendeKontonummer}" ,'${fehlenderKontoBeschriftung}') `;
    pool.query(insertAnfrage1, (err, results) => {
      if (err) {
        throw err;
      } else {
        console.log("Konto wurde eingefügt");
      }
    });

    // ******************************************************

    let wb = XLSX.read(path, { type: "file" });
    let ws = wb.Sheets[wb.SheetNames[0]];
    XLSX.utils.sheet_add_aoa(ws, [[
      "Kontonummer",
      "Kontoname",
      "ZusFkt",
      "Hauptfunktionstyp",
      "HFNr",
      "Funktionsergaenzung",
      "Faktor2_Prozent",
      "KtoNr1_Faktor2",
      "KtoNr2_Faktor2",
      "Funktionsbezeichnung",
      "Anlagenspiegelfunktion"
    ]], {
      origin: "A1"
    });
    var result = XLSX.utils.sheet_to_json(wb.Sheets.Sheet1);
    for (i = 0; i < result.length; i++) {

      insertAnfrage = ` INSERT INTO kontenstammdaten 
                        ( verfahrenId, kontoNummer, kontoName ) 
                        VALUES  ("${verfahrenId}", '${result[i].Kontonummer}' ,'${result[i].Kontoname}' )`;
      pool.query(insertAnfrage, (err, results) => {
        if (err) {
          throw err;
        } else {
          console.log("Konto wurde eingefügt");
        }
      });
    }


    res.json({ fileName: file.name, filePath: path });
  });
}); */

// ****************************************************************************
router.put("/datevSachKontenStammUpload/:vefahrenId", function (req, res) {
  // File Upload **********
  if (req.files === null) {
    return res.status(400).json({ msg: "keine Datei wurde hochgeladen !" });
  }
  const verfahrenId = req.params.vefahrenId
  const file = req.files.file;
  const filename = req.files.file.name
  const path = `./uploads/${filename}`;
  // File in den Ordner anlegen
  file.mv(path, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }
    // Die erste Zeile von der Datei huinzufügen, weil die später durch die neue Header ersetzt wird
    // ******************************************************
    let header = get_header_row(path);
    let fehlendeKontonummer = header[0][0];
    let fehlenderKontoBeschriftung = header[0][1];

    anfrage1 = ` UPDATE buchungen  SET
    kontoBeschriftung = '${fehlenderKontoBeschriftung}' 
    WHERE(verfahrenId= "${verfahrenId}" AND kontoNummer = "${fehlendeKontonummer}" )
    ORDER BY id 
    `;
    anfrage2 = ` UPDATE buchungen  SET
    gegenkontoBeschriftung = '${fehlenderKontoBeschriftung}'
    WHERE(verfahrenId= "${verfahrenId}" AND gegenkontoNummer = "${fehlendeKontonummer}" )
    ORDER BY id 
    `;
    pool.query(anfrage1, (err, results) => {
      if (err) {
        throw err;
      } else {
        console.log("KontoBeschriftung wurde eingefügt");
      }
    });
    pool.query(anfrage2, (err, results) => {
      if (err) {
        throw err;
      } else {
        console.log("GegenkontoBeschriftung wurde eingefügt");
      }
    });
    // ******************************************************

    var wb = XLSX.read(path, { type: "file" });
    var ws = wb.Sheets[wb.SheetNames[0]];
    XLSX.utils.sheet_add_aoa(ws, [[
      "Kontonummer",
      "Kontoname",
      "ZusFkt",
      "Hauptfunktionstyp",
      "HFNr",
      "Funktionsergaenzung",
      "Faktor2_Prozent",
      "KtoNr1_Faktor2",
      "KtoNr2_Faktor2",
      "Funktionsbezeichnung",
      "Anlagenspiegelfunktion"
    ]], {
      origin: "A1"
    });
    var result = XLSX.utils.sheet_to_json(wb.Sheets.Sheet1);
    for (i = 0; i < result.length; i++) {
      anfrage1 = ` UPDATE buchungen  SET
        kontoBeschriftung = '${result[i].Kontoname}' 
        WHERE(verfahrenId= "${verfahrenId}" AND kontoNummer = "${result[i].Kontonummer}" )
        ORDER BY id 
        `;
      anfrage2 = ` UPDATE buchungen  SET
        gegenkontoBeschriftung = '${result[i].Kontoname}' 
        WHERE(verfahrenId= "${verfahrenId}" AND gegenkontoNummer = "${result[i].Kontonummer}" )
        ORDER BY id 
        `;
      pool.query(anfrage1, (err, results) => {
        if (err) {
          throw err;
        } else {
          console.log("KontoBeschriftung wurde eingefügt");
        }
      });
      pool.query(anfrage2, (err, results) => {
        if (err) {
          throw err;
        } else {
          console.log("GegenkontoBeschriftung wurde eingefügt");
        }
      });
    }
    res.json({ filename: filename, msg: "erfolgreich" });
  });
});
// ****************************************************************************
// ****************************************************************************
router.post("/datevSachKontenStammUploadALT", function (req, res) {
  // File Upload **********
  if (req.files === null) {
    return res.status(400).json({ msg: "keine Datei wurde hochgeladen !" });
  }
  const file = req.files.file;
  const path = `./uploads/${file.name}`;
  // File in den Ordner anlegen
  file.mv(path, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }
    // Die erste Zeile von der Datei huinzufügen, weil die später durch die neue Header ersetzt wird
    // ******************************************************
    let header = get_header_row(path);
    let fehlendeKontonummer = header[0][0];
    let fehlenderKontoBeschriftung = header[0][1];
    insertAnfrage3 = `UPDATE datevbuchungen SET kontoBeschriftung	 = '${fehlenderKontoBeschriftung}'
    WHERE kontoNummer = "${fehlendeKontonummer}" `;
    pool.query(insertAnfrage3, (err, results) => {
      if (err) {
        throw err;
      }
    });
    // ******************************************************

    let wb = XLSX.read(path, { type: "file" });
    let ws = wb.Sheets[wb.SheetNames[0]];
    XLSX.utils.sheet_add_aoa(ws, [["KontonummerdesKontos", "Beschriftung"]], {
      origin: "A1"
    });
    // add the first row from the original xlsx, that we overwrited
    /*     XLSX.utils.sheet_add_aoa(ws, [
          [header[0][0], header[0][1]]
        ], { origin: -1 }); */
    // upload to the path
    XLSX.writeFile(wb, path);

    var result = XLSX.utils.sheet_to_json(wb.Sheets.Sheet1);
    for (i = 0; i < result.length; i++) {
      insertAnfrage1 = `UPDATE datevbuchungen  SET gegenkontoBeschriftung = '${result[i].Beschriftung}'
                                            WHERE gegenkontoNummer	 = "${result[i].KontonummerdesKontos}"
                                             `;

      insertAnfrage2 = `UPDATE datevbuchungen SET kontoBeschriftung	 = '${result[i].Beschriftung}'
                                            WHERE kontoNummer = "${result[i].KontonummerdesKontos}" `;

      pool.query(insertAnfrage1, (err, results) => {
        if (err) {
          throw err;
        } else {
          //     console.log("Sachstammdaten,  Ein GegenkontoBeschriftung wurde eingefügt");
        }
      });

      pool.query(insertAnfrage2, insertAnfrage2, (err, results) => {
        if (err) {
          throw err;
        } else {
          //   console.log("Sachstammdaten,  Ein KontoBeschriftung wurde eingefügt");
        }
      });
    }


    res.json({ fileName: file.name, filePath: path });
  });
});

// ****************************************************************************
router.post("/datevDebitorenKreditorenstammdatenUploadALT", function (req, res) {
  // File Upload **********
  if (req.files === null) {
    return res.status(400).json({ msg: "keine Datei wurde hochgeladen !" });
  }
  const file = req.files.file;
  const path = `./uploads/${file.name}`;
  // File in den Ordner anlegen
  file.mv(path, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }
    // Die erste Zeile von der Datei huinzufügen, weil die später durch die neue Header ersetzt wird
    // ******************************************************
    let header = get_header_row(path);
    let fehlendeKontonummer = header[0][0];
    let fehlenderKontoBeschriftung = header[0][1];
    insertAnfrage1 = ` INSERT INTO kontenstammdaten 
                      ( verfahrenId, Kontonummer, Kontoname) 
                      VALUES  ( "${verfahrenId}", "${fehlendeKontonummer}" ,'${fehlenderKontoBeschriftung}') `;
    pool.query(insertAnfrage1, (err, results) => {
      if (err) {
        throw err;
      } else {
        console.log("Konto wurde eingefügt");
      }
    });

    // ******************************************************
    var wb = XLSX.read(path, { type: "file" });
    var ws = wb.Sheets[wb.SheetNames[0]];
    XLSX.utils.sheet_add_aoa(
      ws,
      [["Kontonummer", "Kontoname"]],
      { origin: "A1" }
    );
    var result = XLSX.utils.sheet_to_json(wb.Sheets.Sheet1);
    for (i = 0; i < result.length; i++) {


      insertAnfrage = ` INSERT INTO kontenstammdaten 
                          ( verfahrenId, Kontonummer, Kontoname ) 
                          VALUES  ("${verfahrenId}", '${result[i].Kontonummer}' ,'${result[i].Kontoname}' )`;
      pool.query(insertAnfrage, (err, results) => {
        if (err) {
          throw err;
        } else {
          console.log("Konto wurde eingefügt");
        }
      });

    }


    res.json({ fileName: file.name, filePath: path });
  });
});

// ****************************************************************************
router.put("/datevDebitorenKreditorenstammdatenUpload/:verfahrenId", function (req, res) {
  // File Upload **********
  if (req.files === null) {
    return res.status(400).json({ msg: "keine Datei wurde hochgeladen !" });
  }
  const verfahrenId = req.params.verfahrenId;
  const file = req.files.file;
  const filename = req.files.file.name;
  const path = `./uploads/${filename}`;
  // File in den Ordner anlegen
  file.mv(path, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }
    // Die erste Zeile von der Datei huinzufügen, weil die später durch die neue Header ersetzt wird
    // ******************************************************
    let header = get_header_row(path);
    let fehlendeKontonummer = header[0][0];
    let fehlenderKontoBeschriftung = header[0][1];
    anfrage1 = ` UPDATE buchungen  SET
    kontoBeschriftung = '${fehlenderKontoBeschriftung}' 
    WHERE(verfahrenId= "${verfahrenId}" AND kontoNummer = "${fehlendeKontonummer}" )
    ORDER BY id 
    `;
    anfrage2 = ` UPDATE buchungen  SET
    gegenkontoBeschriftung = '${fehlenderKontoBeschriftung}' 
    WHERE(verfahrenId= "${verfahrenId}" AND gegenkontoNummer = "${fehlendeKontonummer}" )
    ORDER BY id 
    `;
    pool.query(anfrage1, (err, results) => {
      if (err) {
        throw err;
      } else {
        console.log("KontoBeschriftung wurde eingefügt");
      }
    });
    pool.query(anfrage2, (err, results) => {
      if (err) {
        throw err;
      } else {
        console.log("gegenKontoBeschriftung wurde eingefügt");
      }
    });
    // ******************************************************
    var wb = XLSX.read(path, { type: "file" });
    var ws = wb.Sheets[wb.SheetNames[0]];
    XLSX.utils.sheet_add_aoa(
      ws,
      [["Kontonummer", "Kontoname"]],
      { origin: "A1" }
    );
    var result = XLSX.utils.sheet_to_json(wb.Sheets.Sheet1);
    for (i = 0; i < result.length; i++) {
      anfrage1 = ` UPDATE buchungen  SET
        kontoBeschriftung = '${result[i].Kontoname}' 
        WHERE(verfahrenId= "${verfahrenId}" AND kontoNummer = "${result[i].Kontonummer}" )
        ORDER BY id 
        `;
      anfrage2 = ` UPDATE buchungen  SET
        gegenkontoBeschriftung = '${result[i].Kontoname}' 
        WHERE(verfahrenId= "${verfahrenId}" AND gegenkontoNummer = "${result[i].Kontonummer}" )
        ORDER BY id 
        `;
      pool.query(anfrage1, (err, results) => {
        if (err) {
          throw err;
        } else {
          console.log("KontoBeschriftung wurde eingefügt");
        }
      });
      pool.query(anfrage2, (err, results) => {
        if (err) {
          throw err;
        } else {
          console.log("GegenkontoBeschriftung wurde eingefügt");
        }
      });
    }


    res.json({ filename: file.name, msg: "erfolgreich" });
  });
});
// ****************************************************************************

// die Buchungen von einem KontoTyp auswählen

router.get("/api/buchungen/kontoTyp/:verfahrenId/:kontoTyp", (req, res) => {
  let select1 = `SELECT DISTINCT  kontoNummer, kontoBeschriftung  FROM buchungen WHERE verfahrenId= "${req.params.verfahrenId}" AND kontoTyp = "${req.params.kontoTyp}" ORDER BY id  `;
  pool.query(select1, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log(results.length)
    res.json(results);
  });

});
router.put("/api/buchungen/kontoTyp/:verfahrenId", (req, res) => {

  pool.query(
    `UPDATE buchungen 
                                   SET   kontoTyp=  "${req.body.kontoTyp}"                                            
                                   WHERE verfahrenId= "${req.params.verfahrenId}" && kontoNummer >= "${req.body.vonKonto}" && kontoNummer <= "${req.body.bisKonto}"
    `,
    (err, results1) => {
      if (err) {
        throw err;
      } else {
        pool.query(
          `UPDATE buchungen 
                                         SET   gegenkontoTyp=  "${req.body.kontoTyp}"                                            
                                         WHERE verfahrenId= "${req.params.verfahrenId}" && gegenkontoNummer >= "${req.body.vonKonto}" && gegenkontoNummer <= "${req.body.bisKonto}"
          `,
          (err, results2) => {
            if (err) {
              throw err;
              res.json({ msg: "fehlgeschlagen" });
            } else {
              console.log("Der KontoTyp wurde in Buchungen bearbeitet");
            }
            if (results2 || results1) {
              res.json({ msg: "erfolgreich" });
            }
          }
        );
      }
    }
  );

  //res.redirect("./");





});
router.put("/api/sap/kontoTyp/:verfahrenId", (req, res) => {

  pool.query(
    `UPDATE sap 
                                   SET   kontoTyp=  "${req.body.kontoTyp}"                                            
                                   WHERE verfahrenId= "${req.params.verfahrenId}" && hauptbuch >= "${req.body.vonKonto}" && hauptbuch <= "${req.body.bisKonto}"
    `,
    (err, results) => {
      if (err) {
        throw err;
      } else if (results) {
        console.log("Der KontoTyp wurde in Buchungen bearbeitet");
        console.log(results)
        res.json({ msg: "erfolgreich" });
      }
    }
  );



});
router.get("/api/sap/kontoTyp/:verfahrenId/:kontoTyp", (req, res) => {
  let select1 = `SELECT DISTINCT  hauptbuch, kontoName FROM sap WHERE verfahrenId = "${req.params.verfahrenId}" AND kontoTyp = "${req.params.kontoTyp}" ORDER BY id  `;
  pool.query(select1, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log("results: ", results)
    res.send(results);
  });

});
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// UPDAATE die Rechnung Belegart von den Kategorien ( Rechnung/Zahlung )
router.get("/api/sap/belegarten/:verfahrenId", (req, res) => {
  let select1 = `SELECT DISTINCT  belegart, belegartTyp FROM sap WHERE verfahrenId = "${req.params.verfahrenId}" 
                                                AND belegart !=""
                                                ORDER BY id  `;
  pool.query(select1, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log("results: ", results)
    res.json(results);
  });

});
router.put("/api/sap/belegart/updateBelegartTyp/:verfahrenId", (req, res) => {
  console.log(req.body.belegart)
  console.log(req.body.belegartTyp)

  pool.query(
    `UPDATE sap  SET   belegartTyp =  "${req.body.belegartTyp}"
                   WHERE verfahrenId= "${req.params.verfahrenId}" AND belegart= "${req.body.belegart}" 
                   ORDER BY belegart
      `,
    (err, results) => {
      if (err) {
        throw err;
      } else if (results) {
        console.log(results.affectedRows)
        if (results.affectedRows > 0) {
          console.log("Der neue BelegartTyp wurde in Buchungen bearbeitet");
          res.json({ msg: "erfolgreich" });
        } else {
          console.log("Fehlgeschlagen");
          res.json({ msg: "fehlgeschlagen" });
        }
      }
    }
  );

});
// ***************************************************************************

// ***************************************************************************
router.get("/api/sap/rechnungBelegarten/:verfahrenId", (req, res) => {
  let select1 = `SELECT DISTINCT  belegart FROM sap WHERE verfahrenId = "${req.params.verfahrenId}" 
                                                AND belegart !="" 
                                                AND belegartTyp = "rechnung"
 
                                                ORDER BY belegart `;
  pool.query(select1, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log("results: ", results.length)
    res.json(results);
  });

});
// ***********************************************************************
// ***************************************************************************
router.get("/api/sap/zahlungBelegarten/:verfahrenId", (req, res) => {
  let select1 = `SELECT DISTINCT  belegart FROM sap WHERE verfahrenId = "${req.params.verfahrenId}" 
                                                AND belegart !="" 
                                                AND belegartTyp = "zahlung"
 
                                                ORDER BY belegart `;
  pool.query(select1, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log("results: ", results.length)
    res.json(results);
  });

});
// ***********************************************************************
// GET die VerfahrenModul vom aktuellen Kunden
router.get("/api/verfahrenAnalyse/:id", (req, res) => {
  var selectAll = `SELECT analyse FROM verfahren WHERE  id= "${req.params.id}" `;
  const x = pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    res.send(results);
  });
});
// *****************************************
// SAP
router.put("/api/kreditorenAnalyse/sap/bemerkung/:id", (req, res) => {
  let id = req.params.id
  let bemerkung = req.body.bemerkung
  let insertAnfrage = `UPDATE sap SET bemerkung = "${bemerkung}" WHERE id = "${id}" `
  pool.query(insertAnfrage,
    (err, results) => {
      if (err) {
        console.log(err);
        return res.send(err);
      }
      console.log("die Bemerkung wurde hinzugefügt ");
      res.json(results);
    });
})
router.put("/api/kreditorenAnalyse/sap/kennzeichen/:id", (req, res) => {
  let id = req.params.id
  let kennzeichen = req.body.kennzeichen
  let insertAnfrage = `UPDATE sap SET kennzeichen = "${kennzeichen}" WHERE id = "${id}" `
  pool.query(insertAnfrage,
    (err, results) => {
      if (err) {
        console.log(err);
        return res.send(err);
      }
      console.log("das kennzeichen wurde hinzugefügt ");
      res.json(results);
    });
})
router.get("/api/markierteBuchungen/sap/:id/:kreditor", (req, res) => {
  var selectAll = `
                  SELECT *
                  FROM sap 
                  WHERE       verfahrenId= "${req.params.id}"
                          AND kreditor = "${req.params.kreditor}"
                          AND kennzeichen != ""
    ORDER BY id 

                   `;

  pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log("glatteBetraege: ", results.length)
    res.send(results);
  });
});
router.get("/api/kreditorenAnalyse/sap/:id/:betrag", (req, res) => {

  let betrag = parseFloat(req.params.betrag)

  let selectAll = `
    SELECT * FROM sap 
           WHERE(
              verfahrenId= "${req.params.id}" 
              AND kreditor !="" 
              AND koart    ="K"
              AND   (   (belegkopftext LIKE "%ndung%"  OR belegkopftext LIKE "%vollzieher%"  OR belegkopftext LIKE "%Obergericht%" OR belegkopftext LIKE "%gericht%" OR belegkopftext LIKE "%OGV%" OR belegkopftext LIKE "%Stundung%" OR belegkopftext LIKE "%nsolvenz%"  OR belegkopftext LIKE "%Aufrechnung%"  OR belegkopftext LIKE "%Vollstreckung%"  OR belegkopftext LIKE "%Vollstreckungsbescheid%"  OR belegkopftext LIKE "%VB%"  OR belegkopftext LIKE "%Zwangsvollstreckung%"  OR belegkopftext LIKE "% ZV %"  OR belegkopftext LIKE "%Teilzahlung%"  OR belegkopftext LIKE "%Ratenzahlung%"  OR belegkopftext LIKE "%Drittschuldner%"  OR belegkopftext LIKE "%Abtretung%"  OR belegkopftext LIKE "%berweisungsbeschluss%"  OR belegkopftext LIKE "%PFÜB%"  OR belegkopftext LIKE "%Verjährung%"  OR belegkopftext LIKE "%ZPO%" OR belegkopftext LIKE "%Inkasso%" OR belegkopftext LIKE "%Versicherung Eidesstattliche%" OR belegkopftext LIKE "%Urteil%" OR belegkopftext LIKE "%Haftung%" OR belegkopftext LIKE "%Kostenfestsetzungsbeschluss%" OR belegkopftext LIKE "%KFB%" OR belegkopftext LIKE "%Mahnbescheid%" OR  (belegkopftext LIKE "%MB%" AND belegkopftext NOT LIKE "%EMBE%" AND belegkopftext NOT LIKE "%GMB%" )  OR belegkopftext LIKE "%Mahnverfahren%" OR belegkopftext LIKE "%Rechtskr%" OR belegkopftext LIKE "%Umschuldung%"  )
                        OR  (referenz LIKE "%ndung%"  OR referenz LIKE "%Obergerichts%"  OR referenz LIKE "%vollzieher%"  OR referenz LIKE "%gericht%" OR referenz LIKE "%OGV%" OR referenz LIKE "%Stundung%" OR referenz LIKE "%nsolvenz%"  OR referenz LIKE "%Aufrechnung%"  OR referenz LIKE "%Vollstreckung%"  OR referenz LIKE "%Vollstreckungsbescheid%"  OR referenz LIKE "%VB%"  OR referenz LIKE "%Zwangsvollstreckung%"  OR referenz LIKE "% ZV %"  OR referenz LIKE "%Teilzahlung%"  OR referenz LIKE "%Ratenzahlung%"  OR referenz LIKE "%Drittschuldner%"  OR referenz LIKE "%Abtretung%"  OR referenz LIKE "%berweisungsbeschluss%"  OR referenz LIKE "%PFÜB%"  OR referenz LIKE "%Verjährung%"  OR referenz LIKE "%ZPO%" OR referenz LIKE "%Inkasso%" OR referenz LIKE "%Versicherung Eidesstattliche%" OR referenz LIKE "%Urteil%" OR referenz LIKE "%Haftung%" OR referenz LIKE "%Kostenfestsetzungsbeschluss%" OR referenz LIKE "%KFB%" OR referenz LIKE "%Mahnbescheid%" OR (referenz LIKE "%MB%" AND referenz NOT LIKE "%EMBE%" AND referenz NOT LIKE "%GMB%") OR referenz LIKE "%Mahnverfahren%" OR referenz LIKE "%Rechtskr%" OR referenz LIKE "%Umschuldung%"  )
                     )
            )
            OR
            (
              verfahrenId= "${req.params.id}"
              AND kreditor !=""
              AND koart ="K"
              AND ( belegart = "KZ" OR belegart = "ZP" OR belegartTyp = "zahlung" )
              AND ( 	(betragHW LIKE "%0,00" AND ( REPLACE(REPLACE(REPLACE(betragHW,",","$"),".",""),"$",".")   >= ${betrag} ) )
                     OR (betragTW LIKE "%0,00" AND ( REPLACE(REPLACE(REPLACE(betragTW,",","$"),".",""),"$",".") >= ${betrag} ) ) 
                  )
              )
            OR 
            (
              verfahrenId= "${req.params.id}" 
              AND kreditor !="" 
              AND koart    ="K"
              AND ausglbel !=""
              AND ( belegart ="RE" OR belegart ="KR" OR belegart ="ZP" OR belegart ="KZ" OR belegartTyp != "" )
              AND ausgleich !="00.00.0000" AND ausgleich !=""
            )
    ORDER BY id 
     `;
  pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log("results: ", results.length)
    res.send(results);
  });

});
router.get("/api/kreditorenAnalyse/sap/details/:id/:kreditor/:betrag", (req, res) => {
  let betrag = parseFloat(req.params.betrag)

  let selectAll = `
    SELECT id, bemerkung ,kennzeichen ,kontoName, kreditor, kreditorname, belegnr, buchdat,  betragHW, betragTW , belegkopftext, referenz
    FROM sap 
    WHERE  (
          verfahrenId= "${req.params.id}"
          AND kreditor = "${req.params.kreditor}"
          AND koart    ="K"
          AND ( belegart = "KZ" OR belegart = "ZP" OR belegartTyp = "zahlung" )
          AND ( 	(betragHW LIKE "%0,00" AND ( REPLACE(REPLACE(REPLACE(betragHW,",","$"),".",""),"$",".")   >= ${betrag} ) )
                OR (betragTW LIKE "%0,00" AND ( REPLACE(REPLACE(REPLACE(betragTW,",","$"),".",""),"$",".") >= ${betrag} ) ) 
              )
        ) 
        OR 
        (
          verfahrenId= "${req.params.id}" 
          AND kreditor = "${req.params.kreditor}" 
          AND koart    ="K"
          AND ausglbel != ""
          AND ( belegart ="RE" OR belegart ="KR" OR belegart ="ZP" OR belegart ="KZ" OR belegartTyp != "" )
          AND ausgleich !="00.00.0000" AND ausgleich !=""
        )
        OR
        (
          verfahrenId= "${req.params.id}" 
          AND koart    ="K"
          AND kreditor  = "${req.params.kreditor}" 
          AND   (   (belegkopftext LIKE "%ndung%"  OR belegkopftext LIKE "%vollzieher%"  OR belegkopftext LIKE "%Obergericht%" OR belegkopftext LIKE "%gericht%" OR belegkopftext LIKE "%OGV%" OR belegkopftext LIKE "%Stundung%" OR belegkopftext LIKE "%nsolvenz%"  OR belegkopftext LIKE "%Aufrechnung%"  OR belegkopftext LIKE "%Vollstreckung%"  OR belegkopftext LIKE "%Vollstreckungsbescheid%"  OR belegkopftext LIKE "%VB%"  OR belegkopftext LIKE "%Zwangsvollstreckung%"  OR belegkopftext LIKE "% ZV %"  OR belegkopftext LIKE "%Teilzahlung%"  OR belegkopftext LIKE "%Ratenzahlung%"  OR belegkopftext LIKE "%Drittschuldner%"  OR belegkopftext LIKE "%Abtretung%"  OR belegkopftext LIKE "%berweisungsbeschluss%"  OR belegkopftext LIKE "%PFÜB%"  OR belegkopftext LIKE "%Verjährung%"  OR belegkopftext LIKE "%ZPO%" OR belegkopftext LIKE "%Inkasso%" OR belegkopftext LIKE "%Versicherung Eidesstattliche%" OR belegkopftext LIKE "%Urteil%" OR belegkopftext LIKE "%Haftung%" OR belegkopftext LIKE "%Kostenfestsetzungsbeschluss%" OR belegkopftext LIKE "%KFB%" OR belegkopftext LIKE "%Mahnbescheid%" OR (belegkopftext LIKE "%MB%" AND belegkopftext NOT LIKE "%EMBE%" AND belegkopftext NOT LIKE "%GMB%" ) OR belegkopftext LIKE "%Mahnverfahren%" OR belegkopftext LIKE "%Rechtskr%" OR belegkopftext LIKE "%Umschuldung%"  )
                    OR  (referenz LIKE "%ndung%"  OR referenz LIKE "%Obergerichts%"  OR referenz LIKE "%vollzieher%"  OR referenz LIKE "%gericht%" OR referenz LIKE "%OGV%" OR referenz LIKE "%Stundung%" OR referenz LIKE "%nsolvenz%"  OR referenz LIKE "%Aufrechnung%"  OR referenz LIKE "%Vollstreckung%"  OR referenz LIKE "%Vollstreckungsbescheid%"  OR referenz LIKE "%VB%"  OR referenz LIKE "%Zwangsvollstreckung%"  OR referenz LIKE "% ZV %"  OR referenz LIKE "%Teilzahlung%"  OR referenz LIKE "%Ratenzahlung%"  OR referenz LIKE "%Drittschuldner%"  OR referenz LIKE "%Abtretung%"  OR referenz LIKE "%berweisungsbeschluss%"  OR referenz LIKE "%PFÜB%"  OR referenz LIKE "%Verjährung%"  OR referenz LIKE "%ZPO%" OR referenz LIKE "%Inkasso%" OR referenz LIKE "%Versicherung Eidesstattliche%"  OR referenz LIKE "%Urteil%" OR referenz LIKE "%Haftung%" OR referenz LIKE "%Kostenfestsetzungsbeschluss%" OR referenz LIKE "%KFB%" OR referenz LIKE "%Mahnbescheid%" OR (referenz LIKE "%MB%" AND referenz NOT LIKE "%EMBE%" AND referenz NOT LIKE "%GMB%" ) OR referenz LIKE "%Mahnverfahren%" OR referenz LIKE "%Rechtskr%" OR referenz LIKE "%Umschuldung%"  )
                 )
        )
    ORDER BY id 
                 `;
  pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log("results: ", results.length)
    res.send(results);
  });


});
router.get("/api/glatteBetraege/sap/:id/:betrag", (req, res) => {

  let betrag = parseFloat(req.params.betrag)
  var selectAll = `
    SELECT id, bemerkung ,kennzeichen ,kontoName, hauptbuch, belegnr, belegart, buchdat, kreditor, kreditorname,  betragTW ,  betragHW, belegkopftext, referenz
    FROM sap 
    WHERE   verfahrenId= "${req.params.id}"
            AND kreditor !=""
            AND koart ="K"
            AND ( belegart = "KZ" OR belegart = "ZP" OR belegartTyp = "zahlung")
            AND ( 	(betragHW LIKE "%0,00" AND ( REPLACE(REPLACE(REPLACE(betragHW,",","$"),".",""),"$",".")   >= ${betrag} ) )
                   OR (betragTW LIKE "%0,00" AND ( REPLACE(REPLACE(REPLACE(betragTW,",","$"),".",""),"$",".") >= ${betrag} ) ) 
                )
ORDER BY id 

     `;
  pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    // console.log("results: ", results.length)
    res.send(results);
  });

});
router.get("/api/auffaelligeEmails/sap/:id", (req, res) => {

  var selectAll = `
    SELECT id, bemerkung, kennzeichen, kontoName, betragHW, hauptbuch, belegnr, belegart, buchdat, kreditor, kreditorname, betragTW, betragHW, belegkopftext, referenz FROM sap
    WHERE verfahrenId = "${req.params.id}"
    AND koart = "K"
    AND((belegkopftext LIKE "%Pfändung%" OR belegkopftext LIKE "%Pfaendung%" OR belegkopftext LIKE "%Vollstreckung%" OR belegkopftext LIKE "%Rechtskräftig%" OR belegkopftext LIKE "%Rechtskraeftig%" OR belegkopftext LIKE "%vollzieher%"  OR belegkopftext LIKE "%Obergericht%" OR belegkopftext LIKE "%gericht%" OR belegkopftext LIKE "%OGV%" OR belegkopftext LIKE "%Stundung%" OR belegkopftext LIKE "%nsolvenz%"  OR belegkopftext LIKE "%Aufrechnung%"  OR belegkopftext LIKE "%Vollstreckung%"  OR belegkopftext LIKE "%Vollstreckungsbescheid%"  OR belegkopftext LIKE "%VB%"  OR belegkopftext LIKE "%Zwangsvollstreckung%"  OR belegkopftext LIKE "% ZV %"  OR belegkopftext LIKE "%Teilzahlung%"  OR belegkopftext LIKE "%Ratenzahlung%"  OR belegkopftext LIKE "%Drittschuldner%"  OR belegkopftext LIKE "%Abtretung%"  OR belegkopftext LIKE "%berweisungsbeschluss%"  OR belegkopftext LIKE "%PFÜB%"  OR belegkopftext LIKE "%Verjährung%"  OR belegkopftext LIKE "%ZPO%" OR belegkopftext LIKE "%Inkasso%" OR belegkopftext LIKE "%Versicherung Eidesstattliche%" OR belegkopftext LIKE "%Urteil%" OR belegkopftext LIKE "%Haftung%" OR belegkopftext LIKE "%Kostenfestsetzungsbeschluss%" OR belegkopftext LIKE "%KFB%" OR belegkopftext LIKE "%Mahnbescheid%" OR belegkopftext LIKE "% MB%" OR belegkopftext LIKE "%MB %"  OR belegkopftext LIKE "%Mahnverfahren%" OR belegkopftext LIKE "%Rechtskr%" OR belegkopftext LIKE "%Umschuldung%" OR belegkopftext LIKE "%Eidesstattliche Erklärung%" OR belegkopftext LIKE "%Eidesstattliche Erklaerung%" OR belegkopftext LIKE "% EE %" OR(belegkopftext LIKE "%Rest%" AND belegkopftext NOT LIKE "%Restaurant%") OR belegkopftext LIKE "%Restzahlung%" OR belegkopftext LIKE "%Vereinbarung%" OR belegkopftext LIKE "%Schulden%" OR belegkopftext LIKE "%Urteil%" OR belegkopftext LIKE "%Rate%" OR belegkopftext LIKE "%Vergleich%")
    OR(referenz LIKE "%Pfändung%" OR referenz LIKE "%Pfaendung%" OR referenz LIKE "%Vollstreckung%" OR referenz LIKE "%Rechtskräftig%" OR referenz LIKE "%Rechtskraeftig%"  OR referenz LIKE "%Obergerichts%"  OR referenz LIKE "%vollzieher%"  OR referenz LIKE "%gericht%" OR referenz LIKE "%OGV%" OR referenz LIKE "%Stundung%" OR referenz LIKE "%nsolvenz%"  OR referenz LIKE "%Aufrechnung%"  OR referenz LIKE "%Vollstreckung%"  OR referenz LIKE "%Vollstreckungsbescheid%"  OR referenz LIKE "%VB%"  OR referenz LIKE "%Zwangsvollstreckung%"  OR referenz LIKE "% ZV %"  OR referenz LIKE "%Teilzahlung%"  OR referenz LIKE "%Ratenzahlung%"  OR referenz LIKE "%Drittschuldner%"  OR referenz LIKE "%Abtretung%"  OR referenz LIKE "%berweisungsbeschluss%"  OR referenz LIKE "%PFÜB%"  OR referenz LIKE "%Verjährung%"  OR referenz LIKE "%ZPO%" OR referenz LIKE "%Inkasso%" OR referenz LIKE "%Versicherung Eidesstattliche%" OR referenz LIKE "%Urteil%" OR referenz LIKE "%Haftung%" OR referenz LIKE "%Kostenfestsetzungsbeschluss%" OR referenz LIKE "%KFB%" OR referenz LIKE "%Mahnbescheid%" OR referenz LIKE "% MB%" OR referenz LIKE "%MB %" OR referenz LIKE "% MB %"  OR referenz LIKE "%Mahnverfahren%" OR referenz LIKE "%Rechtskr%" OR referenz LIKE "%Umschuldung%" OR referenz LIKE "%Eidesstattliche Erklärung%" OR referenz LIKE "%Eidesstattliche Erklaerung%" OR  referenz LIKE "% EE %" OR(referenz LIKE "%Rest%" AND referenz NOT LIKE "%Restaurant%") OR referenz LIKE "%Restzahlung%" OR referenz LIKE "%Vereinbarung%" OR referenz LIKE "%Schulden%" OR referenz LIKE "%Urteil%" OR referenz LIKE "%Rate%" OR referenz LIKE "%Vergleich%")
                                )

  ORDER BY id 
    `;
  pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log("auffaelligeTexte", results.length)
    res.send(results);
  });
});

router.get("/api/zahlungsAnalyse/sap/:id", (req, res) => {

  /*   var selectAll = `
      SELECT id, bemerkung, kennzeichen, kontoName, buchdat, betragTW, betragHW, kreditor, kreditorname, belegnr, belegart, belegartTyp, koart, hauptbuch, belDatum, ausgleich, ausglbel  FROM sap
      WHERE verfahrenId = "${req.params.id}"
      AND (kreditor != "")
      AND koart = "K"
      AND ausglbel != ""
      AND(belegart != "")
  
      AND ausgleich != "00.00.0000" AND ausgleich != ""
    
    
      ORDER BY belegnr
        `; */
  var selectAll = `
      SELECT id, bemerkung, kennzeichen, kontoName, buchdat, betragTW, betragHW, kreditor, kreditorname, belegnr, belegart, belegartTyp, koart, hauptbuch, belDatum, ausgleich, ausglbel, nettoFaelligkeit  FROM sap
      WHERE verfahrenId = "${req.params.id}"
      AND (kreditor != "")
      AND koart = "K"
      AND(belegartTyp = "rechnung" OR belegartTyp = "zahlung")
      AND ausgleich != "00.00.0000" AND ausgleich != ""
    
      ORDER BY belegnr
        `;
  pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log("zahlungsAnalyse: ", results.length)
    res.json(results);
  });
});
router.get("/api/glatteBetraege/sap/details/:id/:kreditor/:betrag", (req, res) => {


  let betrag = parseFloat(req.params.betrag)

  let selectAll = `
SELECT id, kontoName, bemerkung, kennzeichen, kreditor, kreditorname, belegnr, buchdat, betragHW, betragTW, belegkopftext, referenz
FROM sap
WHERE   verfahrenId = "${req.params.id}"
AND kreditor = "${req.params.kreditor}"
AND koart = "K"
AND(belegart = "KZ" OR belegart = "ZP"  OR belegartTyp = "zahlung")
AND((betragHW LIKE "%0,00" AND(REPLACE(REPLACE(REPLACE(betragHW, ",", "$"), ".", ""), "$", ".") >= ${betrag}))
OR(betragTW LIKE "%0,00" AND(REPLACE(REPLACE(REPLACE(betragTW, ",", "$"), ".", ""), "$", ".") >= ${betrag})) 
            )
ORDER BY id 
`;
  pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log("results: ", results.length)
    res.send(results);
  });
});
router.get("/api/sap/belegnrDetails/:id/:belegnr", (req, res) => {
  var selectAll = `
SELECT * FROM sap
WHERE   verfahrenId = "${req.params.id}"
AND belegnr = "${req.params.belegnr}"

ORDER BY id 
  `;
  pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    res.send(results);
  });


});
router.get("/api/zahlungsAnalyse/sap/details/:id/:kreditor", (req, res) => {

  var selectAll = `
SELECT id, bemerkung, kennzeichen, kontoName, kreditor, kreditorname, belegnr, belegart, belegartTyp, koart, buchdat, hauptbuch, belDatum, ausgleich, ausglbel, betragHW, betragTW  FROM sap
WHERE verfahrenId = "${req.params.id}"
AND kreditor = "${req.params.kreditor}"
AND koart = "K"
AND ausglbel != ""
AND(belegart = "RE" OR belegart = "KR" OR belegart = "ZP" OR belegart = "KZ")
AND ausgleich != "00.00.0000" AND ausgleich != ""


ORDER BY belegnr
  `;
  pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log(results.length)
    res.json(results);
  });
});

router.get("/api/auffaelligeEmails/sap/details/:id/:kreditor", (req, res) => {
  var selectAll = `
SELECT * FROM sap
WHERE verfahrenId = "${req.params.id}"
AND koart = "K"
AND kreditor = "${req.params.kreditor}"
AND((belegkopftext LIKE "%Pfändung%" OR belegkopftext LIKE "%Pfaendung%" OR belegkopftext LIKE "%Vollstreckung%" OR belegkopftext LIKE "%Rechtskräftig%" OR belegkopftext LIKE "%Rechtskraeftig%"  OR belegkopftext LIKE "%vollzieher%"  OR belegkopftext LIKE "%Obergericht%" OR belegkopftext LIKE "%gericht%" OR belegkopftext LIKE "%OGV%" OR belegkopftext LIKE "%Stundung%" OR belegkopftext LIKE "%nsolvenz%"  OR belegkopftext LIKE "%Aufrechnung%"  OR belegkopftext LIKE "%Vollstreckung%"  OR belegkopftext LIKE "%Vollstreckungsbescheid%"  OR belegkopftext LIKE "%VB%"  OR belegkopftext LIKE "%Zwangsvollstreckung%"  OR belegkopftext LIKE "% ZV %"  OR belegkopftext LIKE "%Teilzahlung%"  OR belegkopftext LIKE "%Ratenzahlung%"  OR belegkopftext LIKE "%Drittschuldner%"  OR belegkopftext LIKE "%Abtretung%"  OR belegkopftext LIKE "%berweisungsbeschluss%"  OR belegkopftext LIKE "%PFÜB%"  OR belegkopftext LIKE "%Verjährung%"  OR belegkopftext LIKE "%ZPO%" OR belegkopftext LIKE "%Inkasso%" OR belegkopftext LIKE "%Versicherung Eidesstattliche%" OR belegkopftext LIKE "%Urteil%" OR belegkopftext LIKE "%Haftung%" OR belegkopftext LIKE "%Kostenfestsetzungsbeschluss%" OR belegkopftext LIKE "%KFB%" OR belegkopftext LIKE "%Mahnbescheid%" OR belegkopftext LIKE "% MB%" OR belegkopftext LIKE "%MB %" OR referenz LIKE "% MB %" OR belegkopftext LIKE "%Mahnverfahren%" OR belegkopftext LIKE "%Rechtskr%" OR belegkopftext LIKE "%Umschuldung%" OR belegkopftext LIKE "%Eidesstattliche Erklärung%" OR belegkopftext LIKE "%Eidesstattliche Erklaerung%" OR  belegkopftext LIKE "% EE %" OR(belegkopftext LIKE "%Rest%" AND belegkopftext NOT LIKE "%Restaurant%") OR belegkopftext LIKE "%Restzahlung%" OR belegkopftext LIKE "%Vereinbarung%" OR belegkopftext LIKE "%Schulden%" OR belegkopftext LIKE "%Urteil%" OR belegkopftext LIKE "%Rate%" OR belegkopftext LIKE "%Vergleich%")
OR(referenz LIKE "%Pfändung%" OR referenz LIKE "%Pfaendung%" OR referenz LIKE "%Vollstreckung%" OR referenz LIKE "%Rechtskräftig%" OR referenz LIKE "%Rechtskraeftig%"  OR referenz LIKE "%Obergerichts%"  OR referenz LIKE "%vollzieher%"  OR referenz LIKE "%gericht%" OR referenz LIKE "%OGV%" OR referenz LIKE "%Stundung%" OR referenz LIKE "%nsolvenz%"  OR referenz LIKE "%Aufrechnung%"  OR referenz LIKE "%Vollstreckung%"  OR referenz LIKE "%Vollstreckungsbescheid%"  OR referenz LIKE "%VB%"  OR referenz LIKE "%Zwangsvollstreckung%"  OR referenz LIKE "% ZV %"  OR referenz LIKE "%Teilzahlung%"  OR referenz LIKE "%Ratenzahlung%"  OR referenz LIKE "%Drittschuldner%"  OR referenz LIKE "%Abtretung%"  OR referenz LIKE "%berweisungsbeschluss%"  OR referenz LIKE "%PFÜB%"  OR referenz LIKE "%Verjährung%"  OR referenz LIKE "%ZPO%" OR referenz LIKE "%Inkasso%" OR referenz LIKE "%Versicherung Eidesstattliche%" OR referenz LIKE "%Urteil%" OR referenz LIKE "%Haftung%" OR referenz LIKE "%Kostenfestsetzungsbeschluss%" OR referenz LIKE "%KFB%" OR referenz LIKE "%Mahnbescheid%" OR referenz LIKE "% MB%" OR referenz LIKE "%MB %" OR referenz LIKE "%Mahnverfahren%" OR referenz LIKE "%Rechtskr%" OR referenz LIKE "%Umschuldung%"  OR referenz LIKE "%Eidesstattliche Erklärung%" OR referenz LIKE "%Eidesstattliche Erklaerung%" OR referenz LIKE "% EE %"  OR(referenz LIKE "%Rest%" AND referenz NOT LIKE "%Restaurant%") OR referenz LIKE "%Restzahlung%" OR referenz LIKE "%Vereinbarung%" OR referenz LIKE "%Schulden%" OR referenz LIKE "%Urteil%" OR referenz LIKE "%Rate%" OR referenz LIKE "%Vergleich%")
               )

ORDER BY id 
  `;
  pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    // console.log(results)
    res.send(results);
  });
});
// *****************************************
// DATEV AND LEXWARE
router.get("/api/auffaelligeEmails/datev/:id/:betrag", (req, res) => {

  var selectAll = `
SELECT id, kontoNummer, kontoBeschriftung, kontoBeschriftung, gegenkontoNummer, gegenkontoBeschriftung, umsatzSoll, umsatzHaben, buchungsText  FROM buchungen
WHERE  verfahrenId = "${req.params.id}"
AND gegenkontoNummer != ""
AND(buchungsText LIKE "%Pfändung%" OR buchungsText LIKE "%Pfaendung%" OR buchungsText LIKE "%Vollstreckung%" OR buchungsText LIKE "%Rechtskräftig%" OR buchungsText LIKE "%Rechtskraeftig%"  OR buchungsText LIKE "%vollzieher%"  OR buchungsText LIKE "%Obergericht%" OR buchungsText LIKE "%gericht%" OR buchungsText LIKE "%OGV%" OR buchungsText LIKE "%Stundung%" OR buchungsText LIKE "%nsolvenz%"  OR buchungsText LIKE "%Aufrechnung%"  OR buchungsText LIKE "%Vollstreckung%"  OR buchungsText LIKE "%Vollstreckungsbescheid%"  OR buchungsText LIKE "%VB%"  OR buchungsText LIKE "%Zwangsvollstreckung%"  OR buchungsText LIKE "% ZV %"  OR buchungsText LIKE "%Teilzahlung%"  OR buchungsText LIKE "%Ratenzahlung%"  OR buchungsText LIKE "%Drittschuldner%"  OR buchungsText LIKE "%Abtretung%"  OR buchungsText LIKE "%berweisungsbeschluss%"  OR buchungsText LIKE "%PFÜB%"  OR buchungsText LIKE "%Verjährung%"  OR buchungsText LIKE "%ZPO%" OR buchungsText LIKE "%Inkasso%" OR buchungsText LIKE "%Versicherung Eidesstattliche%" OR buchungsText LIKE "%Urteil%" OR buchungsText LIKE "%Haftung%" OR buchungsText LIKE "%Kostenfestsetzungsbeschluss%" OR buchungsText LIKE "%KFB%" OR buchungsText LIKE "%Mahnbescheid%"  OR buchungsText LIKE "%Mahnverfahren%" OR buchungsText LIKE "%MB %" OR buchungsText LIKE "% MB%" OR referenz LIKE "% MB %" OR buchungsText LIKE "%Rechtskr%" OR buchungsText LIKE "%Umschuldung%" OR buchungsText LIKE "%Eidesstattliche Erklärung%" OR buchungsText LIKE "%Eidesstattliche Erklaerung%" OR buchungsText LIKE "% EE %" OR(buchungsText LIKE "%Rest%" AND buchungsText NOT LIKE "%Restaurant%") OR buchungsText LIKE "%Restzahlung%" OR buchungsText LIKE "%Vereinbarung%" OR buchungsText LIKE "%Schulden%" OR buchungsText LIKE "%Urteil%" OR buchungsText LIKE "%Rate%" OR buchungsText LIKE "%Vergleich%")

ORDER BY id 
  `;
  pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log("length: ", results.length)
    res.send(results);
  });
});
router.get("/api/auffaelligeEmails/lexware/:id/:betrag", (req, res) => {

  var selectAll = `
SELECT id, kontoNummer, kontoBeschriftung, kontoBeschriftung, gegenkontoNummer, gegenkontoBeschriftung, umsatzSoll, umsatzHaben, buchungsText  FROM buchungen
WHERE  verfahrenId = "${req.params.id}"
AND gegenkontoNummer != ""
AND(buchungsText LIKE "%Pfändung%" OR buchungsText LIKE "%Pfaendung%" OR buchungsText LIKE "%Vollstreckung%" OR buchungsText LIKE "%Rechtskräftig%" OR buchungsText LIKE "%Rechtskraeftig%" OR buchungsText LIKE "%vollzieher%"  OR buchungsText LIKE "%Obergericht%" OR buchungsText LIKE "%gericht%" OR buchungsText LIKE "%OGV%" OR buchungsText LIKE "%Stundung%" OR buchungsText LIKE "%nsolvenz%"  OR buchungsText LIKE "%Aufrechnung%"  OR buchungsText LIKE "%Vollstreckung%"  OR buchungsText LIKE "%Vollstreckungsbescheid%"  OR buchungsText LIKE "%VB%"  OR buchungsText LIKE "%Zwangsvollstreckung%"  OR buchungsText LIKE "% ZV %"  OR buchungsText LIKE "%Teilzahlung%"  OR buchungsText LIKE "%Ratenzahlung%"  OR buchungsText LIKE "%Drittschuldner%"  OR buchungsText LIKE "%Abtretung%"  OR buchungsText LIKE "%berweisungsbeschluss%"  OR buchungsText LIKE "%PFÜB%"  OR buchungsText LIKE "%Verjährung%"  OR buchungsText LIKE "%ZPO%" OR buchungsText LIKE "%Inkasso%" OR buchungsText LIKE "%Versicherung Eidesstattliche%"  OR buchungsText LIKE "%Urteil%" OR buchungsText LIKE "%Haftung%" OR buchungsText LIKE "%Kostenfestsetzungsbeschluss%" OR buchungsText LIKE "%KFB%" OR buchungsText LIKE "%Mahnbescheid%" OR buchungsText LIKE "%MB %" OR buchungsText LIKE "% MB%" OR referenz LIKE "% MB %" OR buchungsText LIKE "%Mahnverfahren%" OR buchungsText LIKE "%Rechtskr%" OR buchungsText LIKE "%Umschuldung%" OR buchungsText LIKE "%Eidesstattliche Erklärung%" OR buchungsText LIKE "%Eidesstattliche Erklaerung%" OR buchungsText LIKE "% EE %" OR(buchungsText LIKE "%Rest%" AND buchungsText NOT LIKE "%Restaurant%") OR buchungsText LIKE "%Restzahlung%" OR buchungsText LIKE "%Vereinbarung%" OR buchungsText LIKE "%Schulden%" OR buchungsText LIKE "%Urteil%" OR buchungsText LIKE "%Rate%" OR buchungsText LIKE "%Vergleich%")

ORDER BY id 
  `;
  pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log(results.length)
    res.send(results);
  });
});
router.get("/api/glatteBetraege/datev/:id/:betrag", (req, res) => {
  let betrag = parseFloat(req.params.betrag)

  var selectAll = `
SELECT id, kontoNummer, kontoBeschriftung, kontoBeschriftung, gegenkontoNummer, gegenkontoBeschriftung, umsatzSoll, umsatzHaben, buchungsText  FROM buchungen
WHERE verfahrenId = "${req.params.id}"
AND(gegenkontoNummer != "")
AND(
  (umsatzSoll LIKE "%0,00" AND REPLACE(REPLACE(REPLACE(umsatzSoll, ",", "$"), ".", ""), "$", ".") >= ${betrag}) AND(umsatzHaben LIKE "%0,00" AND REPLACE(REPLACE(REPLACE(umsatzSoll, ",", "$"), ".", ""), "$", ".") >= ${betrag})
                           )


ORDER BY id 
  `;
  pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log("length: ", results.length)
    res.send(results);
  });
});
router.get("/api/glatteBetraege/datev/details/:id/:gegenkonto/:betrag", (req, res) => {
  let betrag = parseFloat(req.params.betrag)

  var selectAll = `
SELECT id, kontoNummer, kontoBeschriftung, belegDatum, gegenkontoNummer, gegenkontoBeschriftung, umsatzSoll, umsatzHaben, buchungsText  FROM buchungen
WHERE verfahrenId = "${req.params.id}"
AND(gegenkontoNummer = "${req.params.gegenkonto}")
AND(
  (umsatzSoll LIKE "%0,00" AND REPLACE(REPLACE(REPLACE(umsatzSoll, ",", "$"), ".", ""), "$", ".") >= ${betrag}) AND(umsatzHaben LIKE "%0,00" AND REPLACE(REPLACE(REPLACE(umsatzSoll, ",", "$"), ".", ""), "$", ".") >= ${betrag})
                           )


ORDER BY id 
  `;
  pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log(results.length)
    res.send(results);
  });
});
router.get("/api/glatteBetraege/lexware/:id/:betrag", (req, res) => {
  let betrag = parseFloat(req.params.betrag)

  var selectAll = `
SELECT id, kontoNummer, kontoBeschriftung, kontoBeschriftung, gegenkontoNummer, gegenkontoBeschriftung, umsatzSoll, umsatzHaben, buchungsText  FROM buchungen
WHERE verfahrenId = "${req.params.id}"
AND gegenkontoNummer != ""
AND(
  (umsatzSoll LIKE "%0,00" AND REPLACE(REPLACE(REPLACE(umsatzSoll, ",", "$"), ".", ""), "$", ".") >= ${betrag}) OR(umsatzHaben LIKE "%0,00" AND REPLACE(REPLACE(REPLACE(umsatzSoll, ",", "$"), ".", ""), "$", ".") >= ${betrag})
          )


ORDER BY id 
  `;
  pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log("length: ", results.length)
    res.send(results);
  });
});
router.get("/api/glatteBetraege/lexware/details/:id/:gegenkonto/:betrag", (req, res) => {
  let betrag = parseFloat(req.params.betrag)

  var selectAll = `
SELECT id, kontoNummer, kontoBeschriftung, belegDatum, gegenkontoNummer, gegenkontoBeschriftung, umsatzSoll, umsatzHaben, buchungsText  FROM buchungen
WHERE verfahrenId = "${req.params.id}"
AND(gegenkontoNummer = "${req.params.gegenkonto}")
AND(
  (umsatzSoll LIKE "%0,00" AND REPLACE(REPLACE(REPLACE(umsatzSoll, ",", "$"), ".", ""), "$", ".") >= ${betrag}) OR(umsatzHaben LIKE "%0,00" AND REPLACE(REPLACE(REPLACE(umsatzSoll, ",", "$"), ".", ""), "$", ".") >= ${betrag})
                           )


ORDER BY id 
  `;
  pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log(results.length)
    res.send(results);
  });
});
router.get("/api/auffaelligeEmails/dat_lex/details/:id/:gegenkonto/", (req, res) => {

  var selectAll = `
SELECT id, kontoNummer, kontoBeschriftung, kontoBeschriftung, gegenkontoNummer, gegenkontoBeschriftung, umsatzSoll, umsatzHaben,belegDatum, buchungsText  FROM buchungen
WHERE  verfahrenId = "${req.params.id}"
AND gegenkontoNummer = "${req.params.gegenkonto}"
AND(buchungsText LIKE "%Pfändung%" OR buchungsText LIKE "%Pfaendung%" OR buchungsText LIKE "%Vollstreckung%" OR buchungsText LIKE "%Rechtskräftig%" OR buchungsText LIKE "%Rechtskraeftig%" OR buchungsText LIKE "%vollzieher%"  OR buchungsText LIKE "%Obergericht%" OR buchungsText LIKE "%gericht%" OR buchungsText LIKE "%OGV%" OR buchungsText LIKE "%Stundung%" OR buchungsText LIKE "%nsolvenz%"  OR buchungsText LIKE "%Aufrechnung%"  OR buchungsText LIKE "%Vollstreckung%"  OR buchungsText LIKE "%Vollstreckungsbescheid%"  OR buchungsText LIKE "%VB%"  OR buchungsText LIKE "%Zwangsvollstreckung%"  OR buchungsText LIKE "% ZV %"  OR buchungsText LIKE "%Teilzahlung%"  OR buchungsText LIKE "%Ratenzahlung%"  OR buchungsText LIKE "%Drittschuldner%"  OR buchungsText LIKE "%Abtretung%"  OR buchungsText LIKE "%berweisungsbeschluss%"  OR buchungsText LIKE "%PFÜB%"  OR buchungsText LIKE "%Verjährung%"  OR buchungsText LIKE "%ZPO%" OR buchungsText LIKE "%Inkasso%" OR buchungsText LIKE "%Versicherung Eidesstattliche%"  OR buchungsText LIKE "%Urteil%" OR buchungsText LIKE "%Haftung%" OR buchungsText LIKE "%Kostenfestsetzungsbeschluss%" OR buchungsText LIKE "%KFB%" OR buchungsText LIKE "%Mahnbescheid%" OR buchungsText LIKE "%MB %" OR buchungsText LIKE "% MB%" OR buchungsText LIKE "%Mahnverfahren%" OR buchungsText LIKE "%Rechtskr%" OR buchungsText LIKE "%Umschuldung%" OR buchungsText LIKE "%Eidesstattliche Erklärung%" OR buchungsText LIKE "%Eidesstattliche Erklaerung%"  OR buchungsText LIKE "% EE %" OR(buchungsText LIKE "%Rest%" AND buchungsText NOT LIKE "%Restaurant%") OR buchungsText LIKE "%Restzahlung%" OR buchungsText LIKE "%Vereinbarung%" OR buchungsText LIKE "%Schulden%" OR buchungsText LIKE "%Urteil%" OR buchungsText LIKE "%Rate%" OR buchungsText LIKE "%Vergleich%")

ORDER BY id 
  `;
  pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log(results.length)
    res.send(results);
  });
});


//**************************************************************************************************** */
// SAP : Liquiditaetsanalyse
// Get alle die Finanzkonten
router.get("/api/sap/Liquiditaetsanalyse/finanzkonten/:verfahrenId", (req, res) => {

  let select = `SELECT DISTINCT  hauptbuch, kontoName, anfangssaldo, anfangssaldoDatum  FROM sap
                       WHERE verfahrenId="${req.params.verfahrenId}" AND kontoTyp="finanzkonto" ORDER BY id `;
  pool.query(select, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log(results.length)
    res.json(results)
  });
});
// *****************************************************************
// Get alle die Finanzkonten
router.get("/api/sap/LiquiditaetsAuswertung/finanzkonten/:verfahrenId", (req, res) => {

  let select = `SELECT   hauptbuch, kontoName, betragTW, betragHW, ausgleich, kontokorrentLinie,anfangssaldo, anfangssaldoDatum, buchdat, belDatum
                 FROM sap 
                 WHERE verfahrenId="${req.params.verfahrenId}" 
                        AND kontoTyp="finanzkonto" 
                        AND buchdat !="" 
                        ORDER BY buchdat`;
  pool.query(select, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log(results.length)
    res.json(results)
  });
});
//*********************************************************************** */
// Get alle die Finanzkonten
router.get("/api/sap/LiquiditaetsAuswertung/finanzkonten/buchdat/:verfahrenId/:datum", (req, res) => {

  let select = `SELECT * FROM sap WHERE verfahrenId="${req.params.verfahrenId}" AND buchdat = "${req.params.datum}"  AND kontoTyp="finanzkonto" AND kontokorrentLinie !="" AND anfangssaldo !=""  ORDER BY buchdat`;
  pool.query(select, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log(results.length)
    res.json(results)
  });
});
// ***************************************************************** */
router.get("/api/sap/kreditlinien/finanzkonten/:verfahrenId/:kontonummer", (req, res) => {

  let select = `SELECT DISTINCT  hauptbuch, kontoName, kontokorrentLinie,anfangssaldo, anfangssaldoDatum, buchdat  FROM sap WHERE verfahrenId="${req.params.verfahrenId}" AND kontoTyp="finanzkonto" AND hauptbuch="${req.params.kontonummer}" ORDER BY hauptbuch `;
  pool.query(select, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    console.log(results.length)
    res.json(results)
  });
});
//***************************************************************** */ 
router.put("/api/sap/Liquiditaetsanalyse/finanzkonten/UpdateDatumAnfangssaldo/:verfahrenId", (req, res) => {
  let verfahrenId = req.params.verfahrenId
  let anfangssaldo = req.body.anfangssaldo
  let datum = req.body.datum
  let kontonummer = req.body.kontonummer

  let updateAnfrage = ` UPDATE sap SET anfangssaldo = "${anfangssaldo}", anfangssaldoDatum = "${datum}"
                          WHERE verfahrenId="${verfahrenId}" AND hauptbuch="${kontonummer}"  
                           ORDER BY id  `;
  pool.query(updateAnfrage, (err, result) => {
    if (err) {
      throw err;
    } else {
      console.log(result.affectedRows)
      if (result.affectedRows > 0)
        res.status(200).send({ message: "updated" })
      else
        res.send({ message: "not updated" })
    }

  })

})
// *****************************************************************
router.get("/api/sap/kreditlinien/buchdat/:verfahrenId/:kontonummer", (req, res) => {
  let verfahrenId = req.params.verfahrenId
  let kontonummer = req.params.kontonummer

  let select = `SELECT buchdat FROM sap WHERE verfahrenId="${verfahrenId}" && hauptbuch="${kontonummer}"  ORDER BY hauptbuch   `;
  pool.query(select, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    res.json(results)
  });
});
// *****************************************************************
router.put("/api/sap/Liquiditaetsanalyse/finanzkonten/UpdateKontokorrentLinie/:verfahrenId", (req, res) => {
  let verfahrenId = req.params.verfahrenId
  let kontokorrentLinie = req.body.kontokorrentLinie
  let kontonummer = req.body.kontonummer
  let buchdatArray = req.body.buchdatArray
  //buchdatArray = buchdatArray.join()
  let temp;
  buchdatArray.map((elem) => {
    if (temp)
      temp = temp + "," + JSON.stringify(elem)
    else
      temp = JSON.stringify(elem)
  })
  console.log(temp)
  let updateAnfrage = ` UPDATE sap SET kontokorrentLinie = "${kontokorrentLinie}" 
    WHERE verfahrenId= "${verfahrenId}" && hauptbuch="${kontonummer}" && buchdat IN (${temp})
     ORDER BY id  `;
  pool.query(updateAnfrage, (err, result) => {
    if (err) {
      console.log(err)
      throw err;
    } else {
      if (result.affectedRows > 0) {
        bool = true
        console.log("1")
      }
      else {
        console.log("2")
        bool = false
      }
    }

  })
  res.send({ message: "erfolgreich" })
})

//****************************************************************** */
// Get Adminstrator
router.get("/api/adminstrator", (req, res) => {
  var selectAll = "SELECT * FROM adminstrator";
  const adminstrator = pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }

    res.send(results)
  });
});

// Get Users
router.get("/api/benutzer", (req, res) => {
  var selectAll = "SELECT * FROM benutzer";
  const users = pool.query(selectAll, (err, results) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    res.send(results)
  });
});

// einen neuen Admin hinzufügen
router.post("/api/insertAdmin", (req, res) => {

  const kunde = req.body.kunde
  var item = {
    benutzername: req.body.kunde.benutzername,
    email: req.body.kunde.email,
    passwort: req.body.kunde.passwort
  };


  const schema = Joi.object({

    benutzername: Joi.string().min(3).required().error(new Error("Sorry,der Benutzername ist fehlerhaft")),
    passwort: Joi.string().required().pattern(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/).error(new Error("Sorry,das Passwort ist fehlerhaft")),
    email: Joi.string()
      .email({ minDomainSegments: 2 })
      .pattern(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
      .error(new Error("Sorry,die Email ist fehlerhaft"))
  });

  var salt = bcrypt.genSaltSync(10);
  kunde.passwort = bcrypt.hashSync(kunde.passwort, salt);

  const result = schema.validate(item);
  if (result.error) {
    res.status(400).send(result.error.message); // Bad Request
    return;
  }
  else {

    pool.query(`INSERT INTO adminstrator(benutzername, email, passwort) VALUES("${kunde.benutzername}", "${kunde.email}", "${kunde.passwort}")`,
      (err, results) => {
        if (err) {
          console.log(err);
          return res.send(err);
        }
        console.log("Ein neuer Admin wurde angelegt");
        res.send(results);
      });
  }


});
// einen neuen Kunden hinzufügen
router.post("/api/insertKunden", (req, res) => {

  const kunde = req.body.kunde
  var item = {
    ansprechpartner: req.body.kunde.ansprechpartner,
    telefon: req.body.kunde.telefon,
    benutzername: req.body.kunde.benutzername,
    email: req.body.kunde.email
  };


  const schema = Joi.object({
    ansprechpartner: Joi.string().min(3).required().pattern(/^[a-zA-Z]+$/).error(new Error("Sorry,der Vorname ist fehlerhaft")),
    telefon: Joi.string().min(3).required().error(new Error("Sorry,das Telefon ist fehlerhaft")),
    benutzername: Joi.string().min(3).required().error(new Error("Sorry,der Benutzername ist fehlerhaft")),
    email: Joi.string()
      .email({ minDomainSegments: 2 })
      .pattern(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
      .error(new Error("Sorry,die Email ist fehlerhaft"))
  });

  const result = schema.validate(item);
  if (result.error) {
    res.status(400).send(result.error.message); // Bad Request
    return;
  }
  else {

    pool.query(`INSERT INTO kunden(benutzername, email, stadt, plz, strasse, hausnummer, telefon, ansprechpartner, bemerkung) VALUES("${kunde.benutzername}", "${kunde.email}", "${kunde.stadt}", "${kunde.plz}", "${kunde.strasse}", "${kunde.hausnummer}", "${kunde.telefon}", "${kunde.ansprechpartner}", "${kunde.bemerkung}")`,
      (err, results) => {
        if (err) {
          console.log(err);
          return res.send(err);
        }
        console.log("Ein neuer Kunde wurde angelegt");
        res.send(results);
      });
  }


});
// einen neuen Verfahren hinzufügen
router.post("/api/insertVerfahren", (req, res) => {

  const kundenId = req.body.kundenId
  const name = req.body.name
  const daten = req.body.daten
  const analyse = req.body.analyse
  const datenQuelle = req.body.datenQuelle

  pool.query(`INSERT INTO verfahren(kundenId, name, daten, analyse, datenQuelle) VALUES("${kundenId}", "${name}", "${daten}", "${analyse}" , "${datenQuelle}")`,
    (err, results) => {
      if (err) {
        console.log(err);
        return res.send(err);
      }
      console.log("einen neuen Verfahren wurde hinzugefügt");
      res.send(results);
    });
});

// einen neuen Benutzer hinzufügen
router.post("/api/insertUser", (req, res) => {

  const user = req.body.neuUser
  var item = {
    rolle: req.body.neuUser.rolle,
    anrede: req.body.neuUser.anrede,
    vorname: req.body.neuUser.vorname,
    nachname: req.body.neuUser.nachname,
    benutzername: req.body.neuUser.benutzername,
    passwort: req.body.neuUser.passwort,
    email: req.body.neuUser.email
    //rolle: user.rolle
  };


  const schema = Joi.object({
    rolle: Joi.string().min(3).required(),
    anrede: Joi.string().min(3).required(),
    vorname: Joi.string().min(3).required().pattern(/^[a-zA-Z]+$/).error(new Error("Sorry,der Vorname ist fehlerhaft")),
    nachname: Joi.string().min(3).required().pattern(/^[a-zA-Z]+$/).error(new Error("Sorry,der Nachname ist fehlerhaft")),
    benutzername: Joi.string().min(3).required().error(new Error("Sorry,der Benutzername ist fehlerhaft")),
    passwort: Joi.string().required().pattern(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/).error(new Error("Sorry,das Passwort ist fehlerhaft")),
    email: Joi.string()
      .email({ minDomainSegments: 2 })
      .pattern(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
      .error(new Error("Sorry,die Email ist fehlerhaft"))
  });

  const result = schema.validate(item);
  if (result.error) {
    res.status(400).send(result.error.message); // Bad Request
    return;
  }

  var salt = bcrypt.genSaltSync(10);
  user.passwort = bcrypt.hashSync(user.passwort, salt);
  const userQuery = pool.query(`INSERT INTO benutzer(kundenId, rolle, anrede, vorname, nachname, email, mobil, benutzername, passwort) VALUES("${user.kundenId}", "${user.rolle}", "${user.anrede}", "${user.vorname}", "${user.nachname}", "${user.email}", "${user.mobile}", "${user.benutzername}", "${user.passwort}")`,
    (err, results) => {
      if (err) {
        console.log(err);
        return res.send(err);
      }
      console.log("a new user inserted");
      res.send(results);
    });
});
// Benutzer Login
router.post("/benutzerLogin", function (req, res, next) {
  var benutzername = req.body.benutzername;
  var passwort = req.body.passwort;
  console.log(benutzername, passwort);
  pool.query(
    `SELECT * FROM Users WHERE benutzername = "${benutzername}"  `,
    (err, results) => {
      if (err) {
        throw err;
      } else {
        console.log(passwort, "::::", results[0].passwort);
        if (passwort === results[0].passwort) console.log("Eingeloggt");

        bcrypt.compare(passwort, results[0].passwort, function (err, isMatch) {
          if (err) throw err;
          if (isMatch) {
            console.log("Eingeloggt");
          } else {
            console.log("Problem mit dem Einloggen");
          }
        });
      }
    }
  );

  // res.render('submit', {items : req.body   }) ;
  res.redirect("./");
});

// Add a new USer
router.post("/neuerBenutzer", function (req, res, next) {
  var item = {
    benutzername: req.body.benutzername,
    passwort: req.body.passwort,
    email: req.body.email,
    rolle: req.body.rolle
  };

  var salt = bcrypt.genSaltSync(10);
  item.passwort = bcrypt.hashSync(item.passwort, salt, 8);

  const schema = Joi.object({
    benutzername: Joi.string()
      .min(3)
      .required(),
    passwort: Joi.string().required(),
    email: Joi.string().email(),
    rolle: Joi.string().required()
  });

  const result = schema.validate(item);
  if (result.error) {
    res.status(400).send(result.error.details[0].message); // Bad Request
  }

  pool.query(
    `INSERT INTO Users(benutzername, passwort, email, rolle) VALUES("${item.benutzername}", "${item.passwort}", "${item.email}", "${item.rolle}")`,
    (err, results) => {
      if (err) {
        throw err;
      } else {
        console.log(" Einen Benutzer wurde erfolgreich hinzugefügt");
      }
    }
  );

  // res.render('submit', {items : req.body   }) ;
  res.redirect("./");
});

// ******************************************************

// ****************************************************************************
router.post("/api/passwortVergessen", (req, res) => {
  anfrage = ` SELECT * FROM benutzer WHERE email = "${req.body.email}" `;

  pool.query(anfrage, (err, result) => {
    if (err) {
      throw err;
    }
    else if (result.length === 0) {
      res.send('Email ist nicht in der DB')
    } else {

      let token = crypto.randomBytes(20).toString('hex');
      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
      var yyyy = today.getFullYear();
      var hh = today.getHours() + 1;
      var mn = today.getMinutes();
      var ss = today.getSeconds();
      today = yyyy + '-' + mm + '-' + dd + '-' + hh + '-' + mn + '-' + ss;
      console.log(today)
      let update = ` UPDATE benutzer SET passwortToken = "${token}", passwortTokenExpire = "${today}"
WHERE email = "${req.body.email}" `;
      pool.query(update, (err, result) => {
        if (err) {
          throw err;
        }
        else {
          console.log("Datensatz wurde bearbeitet")
          const output = `
  < p > Willkommen bei venator - portal! </p >
    <p> Sie bekommen diese Email, weil Sie ein neues Passwort für Ihr Konto angefordert haben.</p>
    <p> -----------------------------------------------------------------------------------------</p>
    <p> Rufen Sie bitte den folgenden Link <a href="http://localhost:3000/reset/${token}\n\n"> http://localhost:3000/reset/${token}\n\n </a> auf, um den Prozess abzuschließen.</p>
    <p><b> Hinweis: </b> für Ihre  Sicherheit läuft der Link in einer Stunde ab. </p>

    <p> Wir wünschen Ihnen viel Erfolg bei der Arbeit mit venator-portal. </p>
    <br>
      <p> Mit freundlichen Grüßen </p>
      <p> Venator Consulting GmbH </p>
    `
          let meineEmail = "mohamad.hamad@venator-consulting.de"
          let transporter = nodemailer.createTransport({
            host: "smtp.ionos.de",
            port: 587,
            secure: false, // upgrade later with STARTTLS
            auth: {
              user: "mohamad.hamad@venator-consulting.de",
              pass: "MohamadHamad!99!"
            },
            tls: {
              // do not fail on invalid certs
              rejectUnauthorized: false
            }
          });
          let mailOptions = {
            from: '"Venator-Portal" <mohamad.hamad@venator-consulting.de>', // sender address
            to: req.body.email, meineEmail, // list of receivers
            subject: "Venator-Consulting GmbH", // Subject line
            text: "Hello world?", // plain text body
            html: output // html body
          }
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              return console.log(error)
            } else {
              console.log("Email wurde gesendet")
            }

          });
        }
      })
      res.send('Email gesendet')
    }
  })

})

// *************************************************************************
router.get("/api/resetPassword", (req, res) => {
  let tokenExpire = new Date();
  let dd = String(tokenExpire.getDate()).padStart(2, '0');
  let mm = String(tokenExpire.getMonth() + 1).padStart(2, '0'); //January is 0!
  let yyyy = tokenExpire.getFullYear();
  let hh = tokenExpire.getHours();
  let mn = tokenExpire.getMinutes();
  let ss = tokenExpire.getSeconds();
  tokenExpire = yyyy + '-' + mm + '-' + dd + '-' + hh + '-' + mn + '-' + ss;

  console.log("resetPasswordToken", tokenExpire)
  anfrage = ` SELECT * FROM benutzer WHERE passwortToken="${req.query.resetPasswordToken}" AND passwortTokenExpire > "${tokenExpire}" `;

  pool.query(anfrage, (err, result) => {
    if (err) {
      throw err;
    } else if (result.length === 0) {
      console.log("result", result)
      res.json("error mit der Anfrage")
    } else {
      console.log("result", result[0].id)

      res.status(200).send({
        id: result[0].id,
        benutzername: result[0].benutzername,
        message: "reset Link ist ok"
      })
    }
  })
})

// ****************************************************************************
router.put("/api/updatePasswordViaEmail", (req, res) => {
  let anfrage = ` SELECT * FROM benutzer WHERE id="${req.body.id}" `;
  pool.query(anfrage, (err, result) => {
    if (err) {
      console.log("der Benutzer ist nicht in der DB")
      res.status(404).json("No User")
    }

    let salt = bcrypt.genSaltSync(10);
    let passwort = bcrypt.hashSync(req.body.passwort, salt);
    let updateAnfrage = ` UPDATE benutzer SET passwort = "${passwort}" WHERE id="${req.body.id}" `;
    pool.query(updateAnfrage, (err, result) => {
      if (err) {
        throw err;
      } else {
        res.status(200).send({ message: "password updated" })
        console.log("password updated")
      }

    })
  })
})
/* Insert ein neuer Kunde */
router.post("/neuerkunde", function (req, res, next) {
  var item = {
    beschriftung: req.body.beschriftung,
    kontonummer: req.body.kontonummer
  };
  const schema = {
    beschriftung: Joi.string()
      .min(3)
      .required(),
    kontonummer: Joi.number().required()
  };
  const result = Joi.validate(item, schema);
  if (result.error) {
    res.status(400).send(result.error.details[0].message); // Bad Request
  }

  pool.query(
    `INSERT INTO kunden (beschriftung , kontonummer) VALUES ( "${item.beschriftung}" , "${item.kontonummer}"  ) `,
    (err, results) => {
      if (err) {
        throw err;
      } else {
        console.log(" Ein Kunde wurde hinzugefügt");
      }
    }
  );
  res.redirect("./");
});

/* Insert ein neuer Lieferant */
router.post("/neuerlieferant", function (req, res, next) {
  var item = {
    beschriftung: req.body.beschriftung,
    kontonummer: req.body.kontonummer
  };
  const schema = {
    beschriftung: Joi.string()
      .min(3)
      .required(),
    kontonummer: Joi.number().required()
  };
  const result = Joi.validate(item, schema);
  if (result.error) {
    res.status(400).send(result.error.details[0].message); // Bad Request
  }

  pool.query(
    `INSERT INTO lieferanten (beschriftung , kontonummer) VALUES ( "${item.beschriftung}" , "${item.kontonummer}"  ) `,
    (err, results) => {
      if (err) {
        throw err;
      } else {
        console.log(" Ein Lieferant wurde hinzugefügt");
      }
    }
  );

  // res.render('submit', {items : req.body   }) ;
  res.redirect("./");
});

// *******************************************************************************
/* Update ein Konto */
router.put("/api/Konten/edit/:id", (req, res) => {
  // Suchen nach dem Konto, wenn es nicht vorhanden, dann 404 Error anzeigen
  console.log(parseInt(req.params.id));

  pool.query(
    `UPDATE Konten
                                   SET beschriftung="${req.body.beschriftung}",
                                       kontonummer= "${req.body.kontonummer}",
                                       kontotyp   = "${req.body.kontotyp}"
                                   WHERE id= ${parseInt(req.params.id)} `,
    (err, results) => {
      if (err) {
        throw err;
      } else {
        console.log("wurde geändert");
      }
    }
  );
  // Validate, wenn die Eingabe ungültig ist, dann zeig 400-Bad Request Fehler an
  // const {error} = validate(req.body); // result.error , andere Möglichkeit !
  if (error) {
    res.status(400).send(result.error.details[0].message);
  }
  res.redirect("./");
});
// ******************************

/* Update ein Gegenkonto */
router.put("/api/gegenkonten/edit/:id", (req, res) => {
  pool.query(
    `UPDATE gegenkonten
                                   SET beschriftung="${req.body.beschriftung}",
                                       kontonummer= "${
    req.body.kontonummer
    }"                                      
                                   WHERE id= ${parseInt(req.params.id)} `,
    (err, results) => {
      if (err) {
        throw err;
      } else {
        console.log("wurde bearbeitet");
      }
    }
  );
  // Validate, wenn die Eingabe ungültig ist, dann zeig 400-Bad Request Fehler an
  // const {error} = validate(req.body); // result.error , andere Möglichkeit !
  if (error) {
    res.status(400).send(result.error.details[0].message);
  }
  res.redirect("./");
});




// *******************************************************************************
/* einen Kunden bearbeiten */
router.put("/api/kunden/edit/:id", (req, res) => {

  pool.query(
    `UPDATE kunden
                                   SET benutzername="${req.body.benutzername}",
                                       email= "${req.body.email}",
                                       stadt   = "${req.body.stadt}",
                                       plz   = "${req.body.plz}",
                                       strasse   = "${req.body.strasse}",
                                       hausnummer   = "${req.body.hausnummer}",
                                       telefon   = "${req.body.telefon}",
                                       ansprechpartner   = "${req.body.ansprechpartner}"
                                   WHERE id = ${req.params.id} `,
    (err, results) => {
      if (err) {
        throw err;
      } else {
        console.log(" Der Kunde wurde bearbeitet");
        res.status(200).send("kunde updated")
      }
    }
  );

});
// *******************************************************************************
/* einen Verfahrenname bearbeiten */
router.put("/api/verfahren/edit/:id", (req, res) => {

  pool.query(
    `UPDATE verfahren
                                   SET name="${req.body.name}" 

                                   WHERE id = ${req.params.id} `,
    (err) => {
      if (err) {
        throw err;
      } else {
        console.log(" Verfahren wurde bearbeitet");
      }
    }
  );
  res.redirect("./");
});
// *******************************************************************************
/* einen Verfahren (Daten und Analyse) bearbeiten */
router.put("/api/verfahren/edit/:id", (req, res) => {

  pool.query(
    `UPDATE verfahren
                                   SET name="${req.body.name}" 
                                   
                                   WHERE id = ${req.params.id} `,
    (err, results) => {
      if (err) {
        throw err;
      } else {
        console.log(" Verfahren wurde bearbeitet");
      }
    }
  );
  if (error) {
    res.status(400).send(result.error.details[0].message);
  }
  res.redirect("./");
});
// *******************************************************************************
/* einen Benutzer bearbeiten */
router.put("/api/benutzer/edit/:id", (req, res) => {
  let Anfrage = `UPDATE benutzer SET
                      vorname="${req.body.vorname}",
                      nachname= "${req.body.nachname}",
                      email   = "${req.body.email}",
                      anrede   = "${req.body.anrede}",
                      mobil   = "${req.body.mobile}",
                      benutzername   = "${req.body.benutzername}",
                      passwort   = "${req.body.passwort}"
                WHERE id = ${req.params.id} `
  pool.query(Anfrage,
    (err, results) => {
      if (err) {
        throw err;
      } else {
        console.log(" Benutzerdaten wurden bearbeitet");
        const meineEmail = "mohamad.hamad@venator-consulting.de"
        const output = `
        <p> Willkommen bei venator-portal. </p>
      <p> Die Bearbeitung Ihres Benutzerkontos ist jetzt abgeschlossen. </p>
      <h3> Ihre Zugangsdaten lauten: </h3>
      <ul>
        <li> Email : ${req.body.email ? req.body.email : ""} </li>
        <li> Benutzername : ${req.body.benutzername ? req.body.benutzername : ""} </li>
        <li> Loginseite : <a href="http://venator-portal.com/ " > http://venator-portal.com/ </a> </li>

      </ul>
      <p> Wir wünschen Ihnen viel Erfolg bei der Arbeit mit venator-portal. </p>
      <br>
        <p> Mit freundlichen Grüßen </p>
        <p> Venator Consulting GmbH </p>
  `
        let transporter = nodemailer.createTransport({
          host: "smtp.ionos.de",
          port: 587,
          secure: false, // upgrade later with STARTTLS
          auth: {
            user: "mohamad.hamad@venator-consulting.de",
            pass: "MohamadHamad!99!"
          },
          tls: {
            // do not fail on invalid certs
            rejectUnauthorized: false
          }
        });
        let mailOptions = {
          from: '"Venator-Portal" <mohamad.hamad@venator-consulting.de>', // sender address
          to: req.body.email, meineEmail, // list of receivers
          subject: "Venator-Consulting GmbH", // Subject line
          text: "Hello world?", // plain text body
          html: output // html body
        }
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return console.log(error)
          }
          console.log("Email wurde erfolgreich gesendet")
        })
      }
    }
  );

  res.send("./");
});
// einen Benutzer löschen
router.delete("/api/benutzer/delete/:benutzerId", (req, res) => {
  // Suchen nach dem Konto, wenn es nicht vorhanden, dann 404 Error anzeigen
  const selectId = `DELETE FROM benutzer WHERE id= ${parseInt(req.params.benutzerId)}`;
  pool.query(selectId, (err, results) => {
    if (err) return res.status(404).send("Die Id ist nicht vorhanden ...");
    else {
      console.log(" Benutzer wurde gelöscht");
    }
  });

  res.redirect("/");
});
// DELETE kunden Method
router.delete("/api/Kunden/delete/:id", (req, res) => {
  // Suchen nach dem Konto, wenn es nicht vorhanden, dann 404 Error anzeigen
  const selectId = `DELETE FROM Kunden WHERE id= ${parseInt(req.params.id)}`;
  pool.query(selectId, (err, results) => {
    if (err) return res.status(404).send("Die Id ist nicht vorhanden ...");
    else {
      console.log(" Kunde wurde gelöscht");
    }
  });

  res.redirect("/");
});

// ***************************************

function validate(konto) {
  const schema = {
    beschriftung: Joi.string()
      .min(3)
      .required(),
    kontonummer: Joi.number().required(),
    kontotyp: Joi.string().min(3)
  };
  const result = Joi.validate(konto, schema);
}
module.exports = router;
