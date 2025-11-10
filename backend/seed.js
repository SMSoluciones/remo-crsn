require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const Boat = require('./models/Boat');
const Event = require('./models/Event');

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
      { name: 'Bote 1', type: 'single', status: 'activo', difficultyLevel: 1, oars: 1 },
      { name: 'Bote 2', type: 'double', status: 'en reparación', difficultyLevel: 2, oars: 2 },
      { name: 'Bote 3', type: 'quad', status: 'activo', difficultyLevel: 3, oars: 4 },
      { name: 'Bote 4', type: 'eight', status: 'activo', difficultyLevel: 4, oars: 8 },
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

async function seedEvents() {
  try {
    await Event.deleteMany();
    const mockEvents = [
      { title: 'Regata Nacional', date: '2025-11-15', description: 'Competencia nacional de remo.', image: 'https://example.com/images/regata-nacional.jpg' },
      { title: 'Entrenamiento Especial', date: '2025-11-20', description: 'Sesión de entrenamiento intensivo.', image: 'https://example.com/images/entrenamiento-especial.jpg' },
      { title: 'Competencia Regional', date: '2025-12-05', description: 'Competencia entre clubes regionales.', image: 'https://example.com/images/competencia-regional.jpg' },
    ];
    await Event.insertMany(mockEvents);
    console.log('Eventos mock agregados correctamente');
  } catch (error) {
    console.error('Error al agregar eventos mock:', error);
  }
}

seed()
  .then(seedEvents)
  .catch(err => console.error(err));

const additionalBoats = [
  { name: 'Bote 5', type: 'single', status: 'activo', difficultyLevel: 1, oars: 1 },
  { name: 'Bote 6', type: 'double', status: 'activo', difficultyLevel: 2, oars: 2 },
  { name: 'Bote 7', type: 'quad', status: 'en reparación', difficultyLevel: 3, oars: 4 },
  { name: 'Bote 8', type: 'eight', status: 'activo', difficultyLevel: 4, oars: 8 },
  { name: 'Bote 9', type: 'single', status: 'activo', difficultyLevel: 1, oars: 1 },
  { name: 'Bote 10', type: 'double', status: 'en reparación', difficultyLevel: 2, oars: 2 },
];

async function seedAdditionalBoats() {
  try {
    await Boat.insertMany(additionalBoats);
    console.log('Botes adicionales mock agregados correctamente');
  } catch (error) {
    console.error('Error al agregar botes adicionales mock:', error);
  }
}

seedAdditionalBoats();

const additionalEvents = [
  { title: 'Festival de Remo', date: '2025-12-10', description: 'Un festival para celebrar el deporte del remo.', image: 'https://via.placeholder.com/150' },
  { title: 'Clínica de Remo', date: '2025-12-15', description: 'Sesión especial para mejorar técnicas de remo.', image: 'https://via.placeholder.com/150' },
  { title: 'Competencia Internacional', date: '2026-01-05', description: 'Competencia con equipos internacionales.', image: 'https://via.placeholder.com/150' },
  { title: 'Entrenamiento Avanzado', date: '2026-01-20', description: 'Entrenamiento para atletas avanzados.', image: 'https://via.placeholder.com/150' },
  { title: 'Regata de Invierno', date: '2026-02-10', description: 'Competencia especial en temporada de invierno.', image: 'https://via.placeholder.com/150' },
  { title: 'Taller de Estrategias', date: '2026-02-25', description: 'Taller para aprender estrategias de competencia.', image: 'https://via.placeholder.com/150' },
];

async function seedAdditionalEvents() {
  try {
    await Event.insertMany(additionalEvents);
    console.log('Eventos adicionales mock agregados correctamente');
  } catch (error) {
    console.error('Error al agregar eventos adicionales mock:', error);
  }
}

seedAdditionalEvents();
