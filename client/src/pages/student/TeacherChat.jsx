import React, { useEffect, useState } from 'react';
import connectionService from '../../services/connectionService';
import ChatInbox from '../../components/chat/ChatInbox';

export default function TeacherChat() {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    connectionService
      .getConnections()
      .then((connections) => setContacts(connections.map((c) => ({ id: c.teacher._id, name: c.teacher.name, email: c.teacher.email }))))
      .catch(() => setContacts([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <span className="eyebrow">Teacher Chat</span>
      <h2>Message your teachers</h2>
      <ChatInbox contacts={contacts} isLoadingContacts={isLoading} contactLabel="teacher" />
    </div>
  );
}
