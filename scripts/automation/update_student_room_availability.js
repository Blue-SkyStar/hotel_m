const fs = require('fs');

const file = 'public/student/student_room_details.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Update cardHtml in renderRooms to show availability
const cardHtmlUpdate = `
                rooms.forEach(room => {
                    // ── Calculate Availability ────────────────────────────────
                    const roomApps = (typeof applications !== 'undefined' ? applications : []).filter(a => a.roomNumber === room.number && a.status === 'Allocated');
                    const isFull = roomApps.length >= room.capacity;
                    let availabilityText = '<span class="text-success small fw-bold"><i class="fa fa-check-circle me-1"></i>Available Now</span>';
                    
                    if (isFull) {
                        // Find the earliest end date among occupants to show when a spot opens
                        const endDates = roomApps.map(a => new Date(a.endDate)).filter(d => !isNaN(d));
                        if (endDates.length > 0) {
                            const earliestEnd = new Date(Math.min(...endDates));
                            availabilityText = '<span class="text-danger small fw-bold"><i class="fa fa-clock me-1"></i>Occupied until ' + earliestEnd.toLocaleDateString('en-IN', {day: 'numeric', month: 'short'}) + '</span>';
                        } else {
                            availabilityText = '<span class="text-danger small fw-bold"><i class="fa fa-times-circle me-1"></i>Fully Occupied</span>';
                        }
                    }

                    let cardHtml = \`
                    <div class="col-md-4 col-sm-6">
                        <div class="room-card shadow-sm h-100 d-flex flex-column" style="border-radius:16px; overflow:hidden;">
                            <div class="room-img-wrapper" style="height: 180px;">
                                <span class="room-badge">\${room.status}</span>
                                <div class="wishlist-btn"><i class="fa fa-heart"></i></div>
                                <img src="\${room.image}" alt="Room" style="width:100%; height:100%; object-fit:cover;">
                            </div>
                            <div class="room-info flex-grow-1 d-flex flex-column p-4">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h6 class="fw-bold mb-0">\${room.type} (Room: \${room.number})</h6>
                                </div>
                                <div class="mb-3">\${availabilityText}</div>
                                <p class="text-muted small mb-2"><i class="fa fa-users me-1"></i> Capacity: \${room.capacity} Person(s)</p>
                                <p class="text-muted small mb-3 flex-grow-1" style="font-size: 0.85rem;">\${room.description}</p>
                                <div class="rating mb-3">
                                    <i class="fa fa-star text-warning"></i><i class="fa fa-star text-warning"></i><i class="fa fa-star text-warning"></i><i class="fa fa-star text-warning"></i><i class="fa fa-star text-warning"></i>
                                    <span class="text-muted small">(\${room.rating})</span>
                                </div>
                                <div class="room-price mt-auto d-flex justify-content-between align-items-center">
                                    <span class="price-tag fw-bold text-primary">₹\${room.price}/mo</span>
                                    <button class="buy-btn btn btn-sm btn-primary rounded-pill px-3" onclick="openApplyModal('\${room.id}')">View / Apply</button>
                                </div>
                            </div>
                        </div>
                    </div>
                \`;`;

const renderRoomsRegex = /rooms\.forEach\(room\s*=>\s*\{[\s\S]*?let\s*cardHtml\s*=\s*`[\s\S]*?`\s*;/;
if (renderRoomsRegex.test(content)) {
    content = content.replace(renderRoomsRegex, cardHtmlUpdate);
    console.log('✅ Updated room details rendering with availability dates');
} else {
    console.log('❌ Failed to find cardHtml logic via regex.');
}

fs.writeFileSync(file, content);
console.log('Done.');
