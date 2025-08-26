let aesKey;

function generateKey() {
  window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  ).then(key => {
    aesKey = key;
    window.crypto.subtle.exportKey("raw", key).then(rawKey => {
      document.getElementById("encryptionKey").value = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
    });
  });
}

async function encryptFile() {
  const fileInput = document.getElementById("encryptFile");
  if (!fileInput.files.length || !aesKey) return alert("Select a file and generate a key first!");

  const file = fileInput.files[0];
  const data = await file.arrayBuffer();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    data
  );

  const encryptedBlob = new Blob([iv, new Uint8Array(encrypted)], { type: "application/octet-stream" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(encryptedBlob);
  a.download = "encrypted_" + file.name;
  a.click();
}

async function decryptFile() {
  const keyBase64 = document.getElementById("decryptionKey").value;
  const fileInput = document.getElementById("decryptFile");
  if (!fileInput.files.length || !keyBase64) return alert("Select a file and enter the key!");

  const keyBuffer = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", keyBuffer, "AES-GCM", true, ["decrypt"]);

  const file = fileInput.files[0];
  const data = new Uint8Array(await file.arrayBuffer());
  const iv = data.slice(0, 12);
  const encryptedData = data.slice(12);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encryptedData
    );

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([decrypted]));
    a.download = "decrypted_" + file.name.replace(".enc", "");
    a.click();
  } catch (err) {
    alert("Decryption failed! Invalid key or file.");
  }
}
