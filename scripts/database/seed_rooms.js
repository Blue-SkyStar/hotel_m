const fs = require('fs-extra');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'db.json');

async function seedRooms() {
    const db = await fs.readJson(dbPath);
    let newRooms = [];
    let baseId = 1;

    // 15 Girls Rooms
    for (let i = 1; i <= 15; i++) {
        let capacity = i % 4 === 0 ? 4 : i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1;
        let typeStr = capacity === 1 ? 'Single' : capacity === 2 ? 'Double' : capacity === 3 ? 'Triple' : 'Quad';
        newRooms.push({
            id: baseId++,
            number: `G-${100 + i}`,
            type: `Girls ${typeStr} Room`,
            capacity: capacity,
            occupied: 0,
            status: "Available",
            price: 5000 - ((capacity - 1) * 1000), // e.g. Single 5000, Double 4000, Triple 3000, Quad 2000
            rating: parseFloat((Math.random() * (5.0 - 4.0) + 4.0).toFixed(1)),
            image: `../img/rooms/${(i % 3) + 1}.png`,
            description: `A comfortable ${typeStr.toLowerCase()} sharing room in the Girls hostel area.`,
            facilities: ["WiFi", "Security", capacity === 1 ? "AC" : "Fan"],
            gender: "Girls"
        });
    }

    // 25 Boys Rooms
    for (let i = 1; i <= 25; i++) {
        let capacity = i % 4 === 0 ? 4 : i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1;
        let typeStr = capacity === 1 ? 'Single' : capacity === 2 ? 'Double' : capacity === 3 ? 'Triple' : 'Quad';
        newRooms.push({
            id: baseId++,
            number: `B-${100 + i}`,
            type: `Boys ${typeStr} Room`,
            capacity: capacity,
            occupied: 0,
            status: "Available",
            price: 5000 - ((capacity - 1) * 1000),
            rating: parseFloat((Math.random() * (5.0 - 4.0) + 4.0).toFixed(1)),
            image: `../img/rooms/${(i % 3) + 1}.png`,
            description: `A spacious ${typeStr.toLowerCase()} sharing room in the Boys hostel area.`,
            facilities: ["WiFi", "Security", capacity === 1 ? "AC" : "Fan"],
            gender: "Boys"
        });
    }

    db.rooms = newRooms;
    await fs.writeJson(dbPath, db, { spaces: 2 });
    console.log(`Seeded 40 rooms successfully. (15 Girls, 25 Boys)`);
}

seedRooms().catch(console.error);
