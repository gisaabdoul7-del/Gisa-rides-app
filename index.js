import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';

const app = express();
app.use(cors()); app.use(express.json());
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
const rides = new Map();
const drivers = new Map([
  ['demo-driver', { id:'demo-driver', name:'Gisa Captain', phone:'+250700000000', vehicle:'Moto • GISA 001', type:'moto', online:true, location:{latitude:-1.9441,longitude:30.0619} }]
]);

const PRICE_PER_KM_RWF = { moto: 500, car: 2500 };

function pricePerKm(type) { return PRICE_PER_KM_RWF[type] || PRICE_PER_KM_RWF.moto; }
function distanceKm(a, b) {
  const R = 6371;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function fareFor(pickup, destination, type='moto') { return Math.round(distanceKm(pickup, destination) * pricePerKm(type)); }
function broadcast(ride) { io.to(`ride:${ride.id}`).emit('ride:update', ride); }

app.get('/health', (_,res)=>res.json({ok:true,service:'gisa-rides'}));
app.get('/drivers/nearby', (_,res)=>res.json([...drivers.values()].filter(d=>d.online)));
app.post('/rides', (req,res)=>{
  const { passengerId, pickup, destination, type='moto' } = req.body;
  if (!passengerId || !pickup || !destination) return res.status(400).json({error:'passengerId, pickup and destination are required'});
  const id = uuid();
  const distance = distanceKm(pickup, destination);
  const ride = { id, passengerId, pickup, destination, type, distanceKm:Number(distance.toFixed(2)), pricePerKm:pricePerKm(type), fare:fareFor(pickup, destination, type), status:'searching' };
  rides.set(id, ride); res.status(201).json(ride);
  setTimeout(()=>autoAssign(id), 2500);
});

function autoAssign(id) {
  const ride = rides.get(id); if (!ride || ride.status !== 'searching') return;
  const driver = [...drivers.values()].find(d=>d.online && d.type===ride.type);
  if (!driver) return;
  ride.driverId = driver.id; ride.driver = { name:driver.name, phone:driver.phone, vehicle:driver.vehicle, location:driver.location }; ride.status='accepted';
  broadcast(ride);
}

app.post('/rides/:id/cancel', (req,res)=>{ const r=rides.get(req.params.id); if(!r) return res.sendStatus(404); r.status='cancelled'; broadcast(r); res.json(r); });

io.on('connection', socket=>{
  socket.on('ride:subscribe', rideId=>socket.join(`ride:${rideId}`));
  socket.on('driver:location', ({rideId, location})=>{ const r=rides.get(rideId); if(!r || !r.driver) return; r.driver.location=location; broadcast(r); });
  socket.on('ride:start', rideId=>{ const r=rides.get(rideId); if(r){r.status='in_progress';broadcast(r);} });
  socket.on('ride:complete', rideId=>{ const r=rides.get(rideId); if(r){r.status='completed';broadcast(r);} });
});

const PORT=process.env.PORT||4000;
httpServer.listen(PORT,()=>console.log(`Gisa Rides API listening on http://localhost:${PORT}`));
