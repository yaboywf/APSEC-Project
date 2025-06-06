import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './js/Login';
import Register from './js/Register';
import Layout from './js/Layout';
import StudentPage from './js/StudentPage';
import AdminPage from './js/AdminPage';
import TeacherAssistantPage from './js/TeacherAssistantPage';
import TeacherPage from './js/TeacherPage';
import NotFound from './js/NotFound';

import "./styles/general.scss";

const root = ReactDOM.createRoot(document.body);
root.render(
	<React.StrictMode>
		<Router>
			<Routes>
				<Route element={<Layout />}>
					<Route path="/" element={<Login />} />
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					<Route path="/student" element={<StudentPage />} />
					<Route path="/admin" element={<AdminPage />} />
					<Route path="/teacher-assistant" element={<TeacherAssistantPage />} />
					<Route path="/teacher" element={<TeacherPage />} />

					<Route path="*" element={<NotFound />} />
				</Route>
			</Routes>
		</Router>
	</React.StrictMode>
);