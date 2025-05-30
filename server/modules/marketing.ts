import express from "express";
import { permissionMiddleware } from "server/permission";

const router: express.Router = express.Router();

// Marketing route

router.get(
  "/",
  permissionMiddleware("marketing_campaign#read"),
  async (req, res) => {
    res.send("Welcome to the Marketing Page!");
  }
);

router.post(
  "/",
  permissionMiddleware("marketing_campaign#create"),
  async (req, res) => {
    res.send("Create Campaign Endpoint");
  }
);

export default router;
