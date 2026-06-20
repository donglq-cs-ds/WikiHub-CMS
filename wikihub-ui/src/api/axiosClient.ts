import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:5213/api', // Đường dẫn Backend của ông
    headers: {
        'Content-Type': 'application/json',
    },
});

export default axiosClient;