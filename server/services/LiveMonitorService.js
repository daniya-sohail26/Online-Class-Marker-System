import { Server } from "socket.io";

class LiveMonitorService {
    constructor() {
        this.io = null;
    }

    initialize(httpServer) {
        this.io = new Server(httpServer, {
            pingTimeout: 30000,
            cors: {
                origin: ["http://localhost:3000", "http://localhost:5173"],
                methods: ["GET", "POST"]
            }
        });

        this.io.on("connection", (socket) => {
            console.log(`🔌 Observer Handshake: ${socket.id}`);
            
            // Observer Pattern: Teacher subscribes to a specific Course "Channel"
            socket.on("subscribe_to_course", (courseId) => {
                socket.join(courseId);
                console.log(`📡 Dashboard Subscribed to Course: ${courseId}`);
            });

            socket.on("disconnect", () => {
                console.log(`❌ Observer Left: ${socket.id}`);
            });
        });
    }

    // Observer Pattern: NOTIFY. This broadcasts to everyone in the 'courseId' room
    notifyStudentUpdate(courseId, studentData) {
        if (!this.io) return;
        this.io.to(courseId).emit("student_update", studentData);
        console.log(`📤 BROADCAST: Student ${studentData.name} updated in Course ${courseId}`);
    }
}

const liveMonitorInstance = new LiveMonitorService();
export default liveMonitorInstance;