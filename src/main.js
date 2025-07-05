import "./style.css";
import { setUpMonaco } from "./editor";
import { startSerial } from "./serial";
const editor = setUpMonaco();
startSerial(editor);
