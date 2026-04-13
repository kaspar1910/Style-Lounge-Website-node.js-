async function loadContent() {
      const response = await fetch('/api/content');
      const data = await response.json();

      document.getElementById('welcomeTitle').value = data.welcomeTitle;
      document.getElementById('welcomeText1').value = data.welcomeText1;
      document.getElementById('welcomeText2').value = data.welcomeText2;
    }

    document.getElementById('contentForm').addEventListener('submit', async (event) => {
      event.preventDefault();

      const payload = {
        welcomeTitle: document.getElementById('welcomeTitle').value,
        welcomeText1: document.getElementById('welcomeText1').value,
        welcomeText2: document.getElementById('welcomeText2').value
      };

      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const saveMessage = document.getElementById('saveMessage');

      if (response.ok) {
        saveMessage.textContent = 'Ændringerne er gemt.';
      } else {
        saveMessage.textContent = 'Noget gik galt. Teksten blev ikke gemt.';
      }
    });

    loadContent();