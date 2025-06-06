import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './js/Login';
import Register from './js/Register';
import Layout from './js/Layout';
import StudentPage from './js/StudentPage';

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
				</Route>
			</Routes>
		</Router>
	</React.StrictMode>
);