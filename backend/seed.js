require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const Boat = require('./models/Boat');

const MONGO_URI = process.env.MONGO_URI;

async function getUsers() {
  const hashedAdmin = await bcrypt.hash('admin', 10);
  return [
    {
      nombre: 'Admin',
      apellido: 'Admin',
      email: 'admin@admin.com',
      rol: 'admin',
      password: hashedAdmin,
    },
    {
      nombre: 'Sebastian',
      apellido: 'Muñoz',
      email: 'smunoz.id@gmail.com',
      rol: 'admin',
      password: await bcrypt.hash('123456', 10),
    },
    {
      nombre: 'Emilio',
      apellido: 'Desantis',
      email: 'emilio@example.com',
      rol: 'entrenador',
      password: await bcrypt.hash('123456', 10),
    },
    {
      nombre: 'Pamela',
      apellido: 'Borgetto',
      email: 'pborgetto@gmail.com',
      rol: 'mantenimiento',
      password: await bcrypt.hash('123456', 10),
    },
  ];
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Conectado a MongoDB');
    await User.deleteMany({});
    const users = await getUsers();
    await User.insertMany(users);
    console.log('Usuarios insertados correctamente');
    // insertar estudiantes
    const Student = require('./models/Student');
    await Student.deleteMany({});
    const mockStudents = [
      { id: 's1', nombre: 'Juan Ignacio', apellido: 'Principiano', domicilio: 'Almafuerte 381', nacimiento: '18/03/2013', dni: '53037855', celular: '3363009654', email: 'marianafelip84@hotmail.com', categoria: 'Escuelita' },
      { id: 's2', nombre: 'Cecilia', apellido: 'Lafalce', domicilio: 'Mitre 224   1 B', nacimiento: '30/09/1962', dni: '16049645', celular: '3364334028', email: 'cecilia_laf@hotmail.com', categoria: 'Adulto - Master' },
      { id: 's3', nombre: 'Edgar Martin', apellido: 'Ramirez', domicilio: 'Geronimo costa 179 bis', nacimiento: '30/01/2007', dni: '47620206', celular: '3364632952', email: 'zuleerica@gmail.com', categoria: 'Promocional' },
      { id: 's4', nombre: 'Stella Maris', apellido: 'Nasif', domicilio: 'José Ingenieros 176', nacimiento: '24/10/1960', dni: '14115381', celular: '3364 626162', email: 'Stellamna241060@gmail.com', categoria: 'Adulto - Master' },
      { id: 's5', nombre: 'Sebastian', apellido: 'Muñoz', domicilio: 'Rioja 66', nacimiento: '15/01/1990', dni: '35070283', celular: '3364205059', email: 'smunoz.id@gmail.com', categoria: 'Adulto - Master' },
      { id: 's6', nombre: 'Eliana', apellido: 'Borasi', domicilio: 'Italia 68', nacimiento: '25/01/1990', dni: '35070347', celular: '3364299379', email: 'eliborasi@gmail.com', categoria: 'Adulto - Master' },
      { id: 's7', nombre: 'Mateo', apellido: 'Schifino', domicilio: 'Don bosco 1134', nacimiento: '19/01/2012', dni: '52021998', celular: '154282370', email: 'schifinoeris@gmail.com', categoria: 'Promocional' },
      { id: 's8', nombre: 'Facundo', apellido: 'Vignoles', domicilio: 'Brown 229', nacimiento: '10/12/1975', dni: '24714974', celular: '3364290623', email: 'fvignoles@gmail.com', categoria: 'Adulto - Master' },
      { id: 's9', nombre: 'Román', apellido: 'Principe', domicilio: '25 de Mayo 549', nacimiento: '20/10/2009', dni: '49854262', celular: '3364185100', email: 'claudiprincipiano@gmail.com', categoria: 'Promocional' },
      { id: 's10', nombre: 'Ian Luca', apellido: 'Chomicz', domicilio: 'Mitre 115', nacimiento: '9/10/2013', dni: '53445258', celular: '3364340129', email: 'marganijorgelina@gmail.com', categoria: 'Escuelita' },
      { id: 's11', nombre: 'Nicolás', apellido: 'Bogado', domicilio: 'Balcarce 1872', nacimiento: '22/07/2004', dni: '45987825', celular: '3364187600', email: 'bogado.nico17@gmail.com', categoria: 'Promocional' },
      { id: 's12', nombre: 'Valentin', apellido: 'Colacilli', domicilio: 'Cernadas 317', nacimiento: '30/12/2010', dni: '50535755', celular: '3364381993', email: 'Eciminari@yahoo.com.ar', categoria: 'Promocional' },
      { id: 's13', nombre: 'Fernando', apellido: 'Villegas', domicilio: 'Liniers 1443', nacimiento: '23/05/1975', dni: '24642140', celular: '3402502099', email: 'Fernando.villegas.1975@gmail.com', categoria: 'Adulto - Master' },
      { id: 's14', nombre: 'Germán Andrés', apellido: 'Veloz', domicilio: 'De la Nación 1684', nacimiento: '17/08/1982', dni: '29559662', celular: '3364258321', email: 'germanveloz158@gmail.com', categoria: 'Adulto - Master' },
      { id: 's15', nombre: 'Genaro', apellido: 'Auligine spadaro', domicilio: 'España 562', nacimiento: '22/07/2012', dni: '52676503', celular: '3364305970', email: 'spadaroalexa7@gmail.com', categoria: 'Promocional' },
      { id: 's16', nombre: 'Pamela', apellido: 'Borgetto', domicilio: 'Nación 1684', nacimiento: '17/03/1989', dni: '33109488', celular: '3364256283', email: 'Pborgetto@gmail.com', categoria: 'Adulto - Master' },
      { id: 's17', nombre: 'Thiago Bautista', apellido: 'Giuggia', domicilio: 'Alvear 810 barrio primavera', nacimiento: '27/01/2010', dni: '49902670', celular: '3364674433', email: 'cattalingabriela59@gmail.com', categoria: 'Escuelita' },
      { id: 's18', nombre: 'Aley', apellido: 'Mendoza', domicilio: 'Grupo 5 casa 48', nacimiento: '20/11/2010', dni: '50402937', celular: '3364317662', email: 'aleylaramendoza@gmail.com', categoria: 'Promocional' },
      { id: 's19', nombre: 'Nancy Delia', apellido: 'Picabea', domicilio: 'Av Savio 540', nacimiento: '6/11/1961', dni: '14545636', celular: '3364 336111', email: 'nancypicabea@gmail.com', categoria: 'Adulto - Master' },
      { id: 's20', nombre: 'Agustin', apellido: 'Zeballos', domicilio: 'Publica 3 1680', nacimiento: '18/05/1999', dni: '41782738', celular: '3364601011', email: 'agusszeballos@gmail.com', categoria: 'Adulto - Master' },
      { id: 's21', nombre: 'Luis Alberto', apellido: 'Muñoz', domicilio: 'Damaso valdez 597', nacimiento: '28/09/1958', dni: '12519962', celular: '3364513512', email: 'luisalbertomz@gmail.com', categoria: 'Adulto - Master' },
      { id: 's22', nombre: 'IARA VICTORIA', apellido: 'RODRIGUEZ', domicilio: 'Bolivia 308', nacimiento: '30/10/2008', dni: '48943714', celular: '3364661462', email: 'almalexiara@gmail.com', categoria: 'Promocional' },
      { id: 's23', nombre: 'Javier Eduardo', apellido: 'Stelzer', domicilio: 'Juan B. Justo 280', nacimiento: '31/12/1983', dni: '30683417', celular: '3364518399', email: 'abogadostelzer@hotmail.com', categoria: 'Adulto - Master' },
      { id: 's24', nombre: 'Emiliano', apellido: 'Alegre', domicilio: 'FOREST 1932', nacimiento: '5/02/2010', dni: '49902631', celular: '3364391845', email: 'luovni@gmail.com', categoria: 'Promocional' },
      { id: 's25', nombre: 'Ciro', apellido: 'Rodriguez', domicilio: 'San martín 537 dto.1', nacimiento: '22/12/2015', dni: '55191797', celular: '3364661480', email: 'Miriamvictoria55amado@gmail.com', categoria: 'Escuelita' },
    ];
    // remove 'id' property and insert
    const studentsToInsert = mockStudents.map(s => {
      const { id, ...rest } = s;
      return rest;
    });
    await Student.insertMany(studentsToInsert);
    console.log('Estudiantes insertados correctamente');
    // insertar botes
    await Boat.deleteMany({});
    const mockBoats = [
      { nombre: 'Bote 1', tipo: 'single', estado: 'activo', fechaIngreso: new Date('2025-01-01'), nivelDif: 3, row: 2 },
      { nombre: 'Bote 2', tipo: 'doble', estado: 'mantenimiento', fechaIngreso: new Date('2025-02-01'), nivelDif: 2, row: 4 },
      { nombre: 'Bote 3', tipo: 'cuadruple', estado: 'fuera_servicio', fechaIngreso: new Date('2025-03-01'), nivelDif: 4, row: 8 },

    ];
    await Boat.insertMany(mockBoats);
    console.log('Botes insertados correctamente');
  } catch (err) {
    console.error('Error al insertar usuarios:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

seed();
