import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

const BASE = `${API_BASE_URL}/api/meetings`;

function getHeaders(auth) {
  const headers = {};
  if (auth?.rol) headers['x-user-role'] = auth.rol;
  return headers;
}

export const fetchMeetings = async () => {
  const response = await axios.get(BASE);
  return response.data;
};

export const createMeeting = async (meetingData, auth) => {
  const response = await axios.post(BASE, meetingData, { headers: getHeaders(auth) });
  return response.data;
};

export const updateMeeting = async (meetingId, meetingData, auth) => {
  const response = await axios.put(`${BASE}/${meetingId}`, meetingData, { headers: getHeaders(auth) });
  return response.data;
};

export const deleteMeeting = async (meetingId, auth) => {
  const response = await axios.delete(`${BASE}/${meetingId}`, { headers: getHeaders(auth) });
  return response.data;
};

export const createMeetingTopic = async (meetingId, topicData, auth) => {
  const response = await axios.post(`${BASE}/${meetingId}/topics`, topicData, { headers: getHeaders(auth) });
  return response.data;
};

export const updateMeetingTopic = async (meetingId, topicId, topicData, auth) => {
  const response = await axios.put(`${BASE}/${meetingId}/topics/${topicId}`, topicData, { headers: getHeaders(auth) });
  return response.data;
};

export const updateMeetingTopicStatus = async (meetingId, topicId, estado, auth) => {
  const response = await axios.patch(
    `${BASE}/${meetingId}/topics/${topicId}/status`,
    { estado },
    { headers: getHeaders(auth) }
  );
  return response.data;
};
