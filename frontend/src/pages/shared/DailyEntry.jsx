import React, { useEffect, useState } from "react";
import { Paper, Typography, List, ListItemButton, ListItemText } from "@mui/material";
import API from "../../api/axios";
import { useParams, useNavigate } from "react-router-dom";

export default function DailyEntry() {
  const { date } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    API.get(`/dispatch/date/${date}`).then(res => setSessions(res.data));
  }, [date]);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5">Dispatch for {date}</Typography>
      <Typography variant="body1" sx={{ mt: 1 }}>
        Select Lunch or Dinner:
      </Typography>

      <List sx={{ mt: 2 }}>
        {sessions.map((s) => (
          <ListItemButton
            key={s.dispatch_id}
            onClick={() => navigate(`/branch/${s.dispatch_id}`)}
          >
            <ListItemText primary={s.session} />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
}
