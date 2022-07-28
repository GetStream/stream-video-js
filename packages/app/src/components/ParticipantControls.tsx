import React, { useState } from 'react';
import {
  Button,
  Collapse,
  Divider,
  Drawer,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Toolbar,
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import SwitchVideo from '@mui/icons-material/SwitchVideo';
import VideoCall from '@mui/icons-material/VideoCall';
import { CreateCall } from './CreateCall';
import { JoinCall } from './JoinCall';
import type { Participants } from '../App';
import { RoomType } from '@stream-io/video-components-react';
import { Call, CallState } from '@stream-io/video-client';

export type ParticipantsProps = {
  participants: Participants;
  currentUser: string;
  setCurrentUser: (name: string) => void;
  currentCall?: Call;
  currentCallState?: CallState;
  room?: RoomType;
  joinCall?: (callId: string) => void;
};

export const ParticipantControls = (props: ParticipantsProps) => {
  const {
    participants,
    currentCall,
    currentCallState,
    currentUser,
    setCurrentUser,
    room,
    joinCall,
  } = props;
  const [isCreateCallExpanded, setIsCreateCallExpanded] = useState(true);
  const [isJoinCallExpanded, setIsJoinCallExpanded] = useState(false);

  return (
    <Drawer
      variant="permanent"
      open
      sx={{
        width: '260px',
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: '260px',
          boxSizing: `border-box`,
          padding: `0 7px`,
        },
      }}
    >
      <Toolbar />
      <List>
        <ListItem>
          <FormControl fullWidth>
            <InputLabel id="iam-label">I am</InputLabel>
            <Select
              label="I am"
              labelId="iam-label"
              value={currentUser}
              onChange={(e) => {
                const name = e.target.value;
                setCurrentUser(name);
              }}
            >
              {Object.entries(participants).map(([name, token]) => (
                <MenuItem key={token} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </ListItem>

        <Divider sx={{ my: 2 }} />

        <ListItemButton
          onClick={() => setIsCreateCallExpanded(!isCreateCallExpanded)}
        >
          <ListItemIcon>
            <VideoCall />
          </ListItemIcon>
          <ListItemText primary="Create call" />
          {isCreateCallExpanded ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={isCreateCallExpanded} timeout="auto" unmountOnExit>
          <CreateCall
            participants={participants}
            currentUser={currentUser}
            currentCallState={currentCallState}
          />
        </Collapse>

        <Divider sx={{ my: 2 }} />

        <ListItemButton
          onClick={() => setIsJoinCallExpanded(!isJoinCallExpanded)}
        >
          <ListItemIcon>
            <SwitchVideo />
          </ListItemIcon>
          <ListItemText primary="Join call" />
          {isJoinCallExpanded ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={isJoinCallExpanded} timeout="auto" unmountOnExit>
          <JoinCall currentCall={currentCall} joinCall={joinCall} />
        </Collapse>
      </List>

      <Divider sx={{ my: 2 }} />

      <Button
        variant={'contained'}
        fullWidth
        color="error"
        disabled={!room}
        startIcon={<VideocamOffIcon />}
        onClick={() => {
          room?.disconnect().then(() => {
            console.log(`Disconnected from call`);
          });
        }}
      >
        Disconnect
      </Button>
    </Drawer>
  );
};
