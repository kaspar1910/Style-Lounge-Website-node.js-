document.addEventListener('DOMContentLoaded', async () => {
  const titleEl = document.getElementById('editableWelcomeTitle');
  const text1El = document.getElementById('editableWelcomeText1');
  const text2El = document.getElementById('editableWelcomeText2');

  console.log('titleEl:', titleEl);
  console.log('text1El:', text1El);
  console.log('text2El:', text2El);

  if (!titleEl || !text1El || !text2El) {
    console.error('Kunne ikke finde tekstfelterne i index.html');
    return;
  }

  try {
    const response = await fetch('/api/content');
    console.log('Status fra /api/content:', response.status);

    const data = await response.json();
    console.log('Indhold fra serveren:', data);

    titleEl.textContent = data.welcomeTitle || '';
    text1El.textContent = data.welcomeText1 || '';
    text2El.textContent = data.welcomeText2 || '';
  } catch (error) {
    console.error('Kunne ikke indlæse tekst:', error);
    titleEl.textContent = 'Teksten kunne ikke indlæses';
    text1El.textContent = '';
    text2El.textContent = '';
  }
});