# 📘Smart Vendor Licensing System — Full Stack Project
A complete digital licensing system built with a Flutter mobile app, a React + Vite officer web portal, and a Node.js (Express) backend powered by a PostgreSQL database.
The system enables vendors to apply for licenses, officers to review applications, and the backend to coordinate communication, payments, and status updates.

## 🚀 Tech Stack Overview
### 📱 Mobile App (Client) — Flutter
Built with Dart

#### Folder structure includes:

screens/ — UI pages

models/ — data models

services/ — API communication

widgets/ — reusable UI components

Used by vendors to apply for licenses, upload details, and receive approval updates.

### 🖥️ Officer Web Portal — React + Vite
Located in the officer-portal/ folder.

Built with React, bundled with Vite

#### Used by officers to:

View incoming license applications

Approve or reject requests

Manage vendor records

Communicates directly with the backend API.

### 🛠️ Backend Server — Node.js + Express
Located in the vendor-backend/ folder.

REST API built with Express.js

#### Handles:

License application processing

Payment handling

Officer decisions

Notifications to the mobile app

Stores all data in a PostgreSQL database

Acts as the communication bridge between Flutter and the React portal.

## 🔗 System Architecture

Code
Flutter Mobile App  <---->  Node.js Backend  <---->  React Officer Portal
        |                        |                        |
        |                        |                        |
        -------- PostgreSQL Database (Central Storage) ----

### Workflow Summary
Vendor (Flutter app) submits a license application.

Backend server receives the request, validates it, processes payments, and stores the data in PostgreSQL.

Officer Web Portal (React) fetches pending applications from the backend.

Officer approves or rejects the application.

Backend updates the database and sends a response back to the Flutter app.

Vendor receives a real‑time status update.

## 📁 Project Structure
Code
SmartVenApp/
│
├── flutter-app/
│   ├── screens/
│   ├── models/
│   ├── services/
│   └── widgets/
│
├── officer-portal/        # React + Vite web app
│   ├── src/
│   ├── public/
│   └── vite.config.js
│
└── vendor-backend/        # Node.js + Express backend
    ├── src/
    │   ├── controllers/
    │   ├── routes/
    │   ├── middleware/
    │   ├── models/
    │   └── services/
    ├── prisma/ or db/     # PostgreSQL schema
    └── server.js
    
## ⚙️ Backend API Highlights
Authentication 

Vendor license application endpoints

Officer approval endpoints

Payment processing

Push notifications / status updates

PostgreSQL ORM / query layer

## 🧪 Running the Project
### 1️⃣ Backend
Code
cd vendor-backend
npm install
npm run dev

### 2️⃣ Officer Web Portal
Code
cd officer-portal
npm install
npm run dev

### 3️⃣ Flutter Mobile App
Code
cd flutter-app
flutter pub get
flutter run

### 🗄️ Database (PostgreSQL)
The backend stores:

Vendor profiles

License applications

Payment records

Officer decisions

Status updates

## 📬 Communication Flow
Flutter → Backend
Submit application

Upload documents

Check status

Backend → React Portal
Provide list of pending applications

Provide vendor details

Receive officer decisions

Backend → Flutter
Send approval/rejection

Notify vendor of updates

## 🛡️ Error Handling & Validation
Backend validates all incoming data

Officer actions are logged

Flutter app displays user‑friendly error messages

Database constraints ensure data integrity

## 🤝 Contributing
Pull requests are welcome.
Please follow clean commit messages and branch naming conventions.

📄 License
This project is licensed under the MIT License.
