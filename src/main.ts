import "./style.css";

import { appsController } from "./app/apps";
import { audioController } from "./app/audio";
import { initializeApp } from "./app/bootstrap";
import { chatController } from "./app/chat";
import { coreController } from "./app/core";
import { attachControllers } from "./app/runtime";
import { speechController } from "./app/speech";
import { systemController } from "./app/system";

attachControllers({
  core: coreController,
  audio: audioController,
  chat: chatController,
  speech: speechController,
  system: systemController,
  apps: appsController,
});

initializeApp();
