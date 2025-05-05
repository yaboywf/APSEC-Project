import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Layout from './js/Layout.jsx';
import { Login } from './js/Login.jsx';
import { Register } from './js/Register.jsx';

import './styles/authentication.scss';

const root = ReactDOM.createRoot(document.body);
root.render(
	<React.StrictMode>
		<Router>
			<Routes>
				<Route element={<Layout />}>
					<Route path="/" element={<Login />} />
					<Route path="/register" element={<Register />} />
				</Route>
			</Routes>
		</Router>
	</React.StrictMode>
);