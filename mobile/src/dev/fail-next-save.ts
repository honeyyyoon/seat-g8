let armed = false;

export function setFailNextSave(value: boolean) {
  armed = value;
}

export function isFailNextSaveArmed() {
  return armed;
}

export function takeFailNextSave() {
  const wasArmed = armed;
  armed = false;
  return wasArmed;
}
