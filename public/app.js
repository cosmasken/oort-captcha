document.addEventListener("DOMContentLoaded", function () {
  fetchBuckets().then(r => console.log("connected"));
  const captchaGrid = document.getElementById('captcha-grid');
            const instruction = document.getElementById('instruction');
            const verifyBtn = document.getElementById('verify-btn');
            const resultDiv = document.getElementById('result');
            const loadingDiv = document.getElementById('loading');
            
            let selectedImages = [];

               // Function to load a new CAPTCHA
               function loadCaptcha() {
                // Reset selections
                selectedImages = [];
                captchaGrid.innerHTML = '';
                verifyBtn.disabled = true;
                resultDiv.style.display = 'none';
                loadingDiv.style.display = 'block';
                
                fetch('/api/captcha')
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            throw new Error(data.error);
                        }
                        
                        // Update instruction
                        instruction.textContent = `${data.message}: Select all ${data.type}`;
                        
                        // Create image grid
                        data.images.forEach(image => {
                            const item = document.createElement('div');
                            item.className = 'captcha-item';
                            item.dataset.id = image.id;
                            
                            const img = document.createElement('img');
                            img.src = image.path;
                            img.alt = image.label;
                            
                            item.appendChild(img);
                            captchaGrid.appendChild(item);
                            
                            // Add click handler
                            item.addEventListener('click', function() {
                                this.classList.toggle('selected');
                                
                                if (this.classList.contains('selected')) {
                                    selectedImages.push(parseInt(this.dataset.id));
                                } else {
                                    selectedImages = selectedImages.filter(id => id !== parseInt(this.dataset.id));
                                }
                                
                                // Enable/disable verify button
                                verifyBtn.disabled = selectedImages.length === 0;
                            });
                        });
                        
                        loadingDiv.style.display = 'none';
                    })
                    .catch(error => {
                        console.error('Error loading CAPTCHA:', error);
                        instruction.textContent = 'Error loading CAPTCHA. Please refresh the page.';
                        loadingDiv.style.display = 'none';
                    });
            }
            
            // Initial load
            loadCaptcha();
            
            // Verify CAPTCHA
            verifyBtn.addEventListener('click', function() {
                if (selectedImages.length === 0) return;
                
                verifyBtn.disabled = true;
                loadingDiv.style.display = 'block';
                
                fetch('/api/verify-captcha', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ selectedIds: selectedImages })
                })
                .then(response => response.json())
                .then(data => {
                    resultDiv.textContent = data.message;
                    resultDiv.className = data.success ? 'result success' : 'result error';
                    resultDiv.style.display = 'block';
                    
                    if (data.success) {
                        // Successful verification - prompt MetaMask transaction
                        setTimeout(() => {
                            alert('Verification successful! You can now proceed.');
                            signMessage();
                        }, 1500);
                    } else {
                        // Failed verification - reload captcha
                        setTimeout(loadCaptcha, 1500);
                    }
                    
                    loadingDiv.style.display = 'none';
                })
                .catch(error => {
                    console.error('Error verifying CAPTCHA:', error);
                    resultDiv.textContent = 'Error processing verification. Please try again.';
                    resultDiv.className = 'result error';
                    resultDiv.style.display = 'block';
                    verifyBtn.disabled = false;
                    loadingDiv.style.display = 'none';
                });
            });

            // Function to sign a message with MetaMask
            async function signMessage() {
                if (typeof window.ethereum !== 'undefined') {
                    try {
                        // Request account access if needed
                        await window.ethereum.request({ method: 'eth_requestAccounts' });
                        
                        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                        const account = accounts[0];
                        
                        // Define the message to be signed
                        const message = 'You are signing this captcha';
                        
                        // Sign the message
                        const signature = await window.ethereum.request({
                            method: 'personal_sign',
                            params: [message, account]
                        });
                        
                        console.log('Message signed:', signature);
                        alert('Message signed! Signature: ' + signature);
                    } catch (error) {
                        console.error('Error signing message:', error);
                        alert('Error signing message: ' + error.message);
                    }
                } else {
                    alert('MetaMask is not installed. Please install MetaMask and try again.');
                }
            }

  async function fetchBuckets() {
    const response = await fetch("/api/list-buckets");
    const buckets = await response.json();
    const bucketList = document.getElementById("buckets");
    buckets.forEach((bucket) => {
      const li = document.createElement("li");
      li.textContent = bucket.Name;
      li.onclick = () => fetchObjects(bucket.Name);
      bucketList.appendChild(li);
    });
  }

  async function fetchObjects(bucketName) {
    currentBucket = bucketName;
    const response = await fetch(`/api/list-objects/${bucketName}`);
    const objects = await response.json();

    console.log(objects);
    const objectsList = document.getElementById("objects");
    objectsList.innerHTML = ""; // Clear previous objects
    if (objects.length === 0) {
      objectsList.innerHTML = "<li>No objects found in this bucket.</li>";
    }
    objects.forEach((object) => {
      const img = document.createElement('img');
      img.src = object.Key;
      img.alt = object.LastModified;
  const bucketName = "captchaimages.standard";
  const imgUrl = `https://${bucketName}.us-east-1.oortstorage.com/${object.Key}`;
    // const imgUrl = `https://${bucketName}.dss.us-east-1.oortech.com/${object.Key}`;
    img.src = imgUrl;
    console.log(imgUrl);
    // Add the image to the list
      objectsList.appendChild(img);
    });

    // Show upload section
    document.getElementById("uploadSection").style.display = "block";
  }

  async function getSignedUrl(bucketName, fileName) {
    try {
      const response = await fetch(`/api/upload-url/${bucketName}/${fileName}`);
      const data = await response.json();
      return data.uploadUrl;
    } catch (err) {
      console.error("Error getting signed URL:", err);
    }
  }

  async function uploadFile() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];

    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    try {
      const signedUrl = await getSignedUrl(currentBucket, file.name);

      await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      alert("File uploaded successfully!");
      await fetchObjects(currentBucket); // Refresh the object list
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Error uploading file.");
    }
  }

  // Make the uploadFile function available globally
  window.uploadFile = uploadFile;
});
