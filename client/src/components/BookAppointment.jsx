// import React, { useEffect, useState } from "react";
// import axios from "axios";

// const BookAppointment = ({ patientId }) => {
//   const [doctors, setDoctors] = useState([]);
//   const [selectedDoctor, setSelectedDoctor] = useState(null);
//   const [date, setDate] = useState("");
//   const [time, setTime] = useState("");
//   const [problem, setProblem] = useState("");

//   // Fetch all doctors from backend
//   useEffect(() => {
//     const fetchDoctors = async () => {
//       try {
//         const res = await axios.get("http://localhost:5000/api/auth/doctors");
//         setDoctors(res.data);
//       } catch (error) {
//         console.error("Error fetching doctors:", error);
//       }
//     };
//     fetchDoctors();
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!selectedDoctor) return alert("Please select a doctor first");

//     const res = await fetch("http://localhost:5000/api/appointments/book", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         patientId,
//         doctorId: selectedDoctor.uniqueId,
//         date,
//         time,
//         problem,
//       }),
//     });

//     const data = await res.json();
//     alert(data.message);
//     setSelectedDoctor(null);
//     setDate("");
//     setTime("");
//     setProblem("");
//   };

//   return (
//     <div className="p-4">
//       {/* Doctor list */}
//       {!selectedDoctor && (
//         <>
//           <h2 className="text-2xl font-bold mb-4 text-gray-700">
//             Select a Doctor
//           </h2>
//           <div className="flex flex-wrap gap-4">
//             {doctors.map((doc) => (
//               <div
//                 key={doc.uniqueId}
//                 className="w-64 p-4 bg-white rounded-xl shadow hover:shadow-lg transition flex flex-col items-center border"
//               >
//                 <div className="w-20 h-20 bg-gray-300 flex items-center justify-center rounded-lg mb-3 font-semibold text-gray-600">
//                   Photo
//                 </div>
//                 <p className="font-semibold text-gray-800">
//                   Dr. {doc.firstName} {doc.lastName}
//                 </p>
//                 <p className="text-sm text-gray-500">{doc.address}</p>
//                 <p className="text-sm text-gray-500 mt-1">ID: {doc.uniqueId}</p>
//                 <button
//                   className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
//                   onClick={() => setSelectedDoctor(doc)}
//                 >
//                   Book
//                 </button>
//               </div>
//             ))}
//           </div>
//         </>
//       )}

//       {/* Booking Form */}
//       {selectedDoctor && (
//         <form
//           onSubmit={handleSubmit}
//           className="p-4 border rounded shadow-md max-w-md mx-auto mt-6 bg-white"
//         >
//           <h2 className="text-xl font-bold mb-4 text-gray-600">
//             Book Appointment with Dr. {selectedDoctor.firstName}{" "}
//             {selectedDoctor.lastName}
//           </h2>
//           <input
//             type="text"
//             value={selectedDoctor.uniqueId}
//             readOnly
//             className="block w-full mb-2 p-2 border rounded bg-black-100"
//           />
//           <input
//             type="date"
//             value={date}
//             onChange={(e) => setDate(e.target.value)}
//             className="block w-full mb-2 p-2 border rounded"
//             required
//           />
//           <input
//             type="time"
//             value={time}
//             onChange={(e) => setTime(e.target.value)}
//             className="block w-full mb-2 p-2 border rounded"
//             required
//           />
//           <textarea
//             placeholder="Describe problem"
//             value={problem}
//             onChange={(e) => setProblem(e.target.value)}
//             className="block w-full mb-2 p-2 border rounded"
//             required
//           />
//           <div className="flex justify-between">
//             <button
//               type="button"
//               className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
//               onClick={() => setSelectedDoctor(null)}
//             >
//               Back
//             </button>
//             <button
//               type="submit"
//               className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//             >
//               Book
//             </button>
//           </div>
//         </form>
//       )}
//     </div>
//   );
// };

// export default BookAppointment;
