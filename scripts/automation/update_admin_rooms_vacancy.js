const fs = require('fs');

const file = 'public/admin/admin_manage_rooms.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Update table headers
content = content.replace(
    '<th class="py-3">Status</th>',
    '<th class="py-3">Status</th>\n                                        <th class="py-3">Next Vacancy</th>'
);

// 2. Update loadRooms logic to calculate vacancy
const loadRoomsUpdate = `
        function loadRooms() {
            let table = document.querySelector("#roomsTable tbody");
            table.innerHTML = "";
            
            if(rooms.length === 0) {
                table.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No rooms added.</td></tr>';
                return;
            }

            rooms.forEach((room, index) => {
                let statusBadge = '<span class="badge bg-success bg-opacity-10 text-success border border-success">Available</span>';
                if(room.status === "Full") statusBadge = '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger">Full</span>';
                if(room.status === "Almost Full") statusBadge = '<span class="badge bg-warning bg-opacity-10 text-warning border border-warning">Almost Full</span>';

                // ── Calculate Next Vacancy ────────────────────────────
                const roomApps = (typeof applications !== 'undefined' ? applications : []).filter(a => a.roomNumber === room.number && a.status === 'Allocated');
                let vacancyText = '<span class="text-success small">Now</span>';
                
                if (roomApps.length >= room.capacity) {
                    const endDates = roomApps.map(a => new Date(a.endDate)).filter(d => !isNaN(d));
                    if (endDates.length > 0) {
                        const earliestEnd = new Date(Math.min(...endDates));
                        vacancyText = '<span class="text-danger fw-bold small">' + earliestEnd.toLocaleDateString('en-IN', {day: 'numeric', month: 'short'}) + '</span>';
                    } else {
                        vacancyText = '<span class="text-muted small">N/A</span>';
                    }
                }

                let row = \`
                <tr>
                    <td class="ps-4">\${index + 1}</td>
                    <td class="fw-medium text-dark">\${room.number}</td>
                    <td><span class="badge bg-secondary">\${room.type}</span></td>
                    <td>\${room.capacity}</td>
                    <td>\${room.occupied || 0}</td>
                    <td>\${statusBadge}</td>
                    <td>\${vacancyText}</td>
                    <td class="pe-4 text-center">
                        <button class="btn btn-sm btn-outline-primary me-1"><i class="fa fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteRoom(\${room.id})"><i class="fa fa-trash"></i></button>
                    </td>
                </tr>
                \`;
                table.innerHTML += row;
            });
        }`;

const loadRoomsRegex = /function\s*loadRooms\(\)\s*\{[\s\S]*?table\.innerHTML\s*\+=\s*row;[\s\S]*?\}\s*\}/;
if (loadRoomsRegex.test(content)) {
    content = content.replace(loadRoomsRegex, loadRoomsUpdate);
    console.log('✅ Updated admin room management with vacancy tracking');
} else {
    console.log('❌ Failed to find loadRooms logic via regex.');
}

fs.writeFileSync(file, content);
console.log('Done.');
