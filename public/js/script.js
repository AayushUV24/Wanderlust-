(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()

const editBtn = document.getElementById("editProfileBtn");
const profileView = document.getElementById("profileView");
const profileEdit = document.getElementById("profileEdit");
const backBtn = document.getElementById("backToProfile");
const profileImageInput = document.getElementById("profileImageInput");
const profileImageForm = document.getElementById("profileImageForm");

if(profileImageInput){
    profileImageInput.addEventListener("change", function(){
        profileImageForm.submit();
    });
}

if (editBtn) {
    editBtn.addEventListener("click", function (e) {
        e.preventDefault();
        profileView.style.display = "none";
        profileEdit.style.display = "block";
    });
}

if (backBtn) {
    backBtn.addEventListener("click", function () {
        profileEdit.style.display = "none";
        profileView.style.display = "block";
    });
}