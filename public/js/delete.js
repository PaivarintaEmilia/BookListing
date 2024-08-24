document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      const confirmation = confirm("Haluatko varmasti poistaa itemin?");
      
      if (confirmation) {
        // Jos käyttäjä vahvistaa poistamisen, lähetetään DELETE-pyyntö
        fetch(`/delete/${id}`, {
          method: 'DELETE'
        })
        .then(response => {
          if (response.ok) {
            // Jos poisto onnistuu, siirrytään takaisin etusivulle
            window.location.href = '/';
          } else {
            alert('Virhe poistettaessa itemiä.');
          }
        })
        .catch(error => {
          console.error('Error:', error);
        });
      } else {
        // Jos käyttäjä peruuttaa, siirrytään takaisin etusivulle
        window.location.href = '/';
      }
    });
});
  