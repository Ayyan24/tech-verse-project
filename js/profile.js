// Techcart Profile Operations

document.addEventListener("DOMContentLoaded", () => {
    window.TechcartDB.onReady(function () {
        const user = window.TechcartDB.getCurrentUser();
        if (!user) {
            Swal.fire({
                icon: "warning",
                title: "Authentication Required",
                text: "Please sign in to view your profile dashboard.",
                confirmButtonColor: "#132238"
            }).then(() => {
                window.location.href = "../login.html";
            });
            return;
        }

        populateUserInfo(user);
        setupMenuToggles();
        setupFormSubmissions(user);
    });
});

// Populate Info
function populateUserInfo(user) {
    const asideName = document.getElementById("aside-username");
    const nameInput = document.getElementById("profile-name");
    const emailInput = document.getElementById("profile-email");
    const phoneInput = document.getElementById("profile-phone");
    const cityInput = document.getElementById("profile-city");
    const addressInput = document.getElementById("profile-address");

    if (asideName) asideName.textContent = user.name;
    if (nameInput) nameInput.value = user.name || "";
    if (emailInput) emailInput.value = user.email || "";
    if (phoneInput) phoneInput.value = user.phone || "";
    if (cityInput) cityInput.value = user.city || "";
    if (addressInput) addressInput.value = user.address || "";
}

// Side Menu Toggles
function setupMenuToggles() {
    const infoBtn = document.getElementById("menu-info-btn");
    const settingsBtn = document.getElementById("menu-settings-btn");
    const infoPanel = document.getElementById("panel-info");
    const settingsPanel = document.getElementById("panel-settings");

    if (infoBtn && settingsBtn) {
        infoBtn.addEventListener("click", () => {
            // styles
            infoBtn.className = "flex items-center gap-2.5 w-full text-left p-3 rounded-xl bg-teal-50 text-teal-600 transition-all";
            settingsBtn.className = "flex items-center gap-2.5 w-full text-left p-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-all";
            // panels
            if (infoPanel) infoPanel.classList.remove("hidden");
            if (settingsPanel) settingsPanel.classList.add("hidden");
        });

        settingsBtn.addEventListener("click", () => {
            // styles
            settingsBtn.className = "flex items-center gap-2.5 w-full text-left p-3 rounded-xl bg-teal-50 text-teal-600 transition-all";
            infoBtn.className = "flex items-center gap-2.5 w-full text-left p-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-all";
            // panels
            if (settingsPanel) settingsPanel.classList.remove("hidden");
            if (infoPanel) infoPanel.classList.add("hidden");
        });
    }
}

// Form Submits
function setupFormSubmissions(currentUser) {
    const infoForm = document.getElementById("profile-info-form");
    const securityForm = document.getElementById("profile-security-form");

    // Profile Details Form
    if (infoForm) {
        infoForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("profile-name").value.trim();
            const phone = document.getElementById("profile-phone").value.trim();
            const city = document.getElementById("profile-city").value.trim();
            const address = document.getElementById("profile-address").value.trim();

            window.TechcartDB.updateUser(currentUser.id, {
                name: name,
                phone: phone,
                city: city,
                address: address
            }).then(function () {
                window.TechcartDB.setCurrentUser(Object.assign({}, currentUser, {
                    name: name,
                    phone: phone,
                    city: city,
                    address: address
                }));

                const asideName = document.getElementById("aside-username");
                if (asideName) asideName.textContent = name;

                Swal.fire({
                    icon: "success",
                    title: "Profile Updated",
                    text: "Your contact and delivery details were successfully saved.",
                    showConfirmButton: false,
                    timer: 1500
                });
            }).catch(function () {
                Swal.fire({
                    icon: "error",
                    title: "Update Failed",
                    text: "Could not save profile. Please try again.",
                    confirmButtonColor: "#132238"
                });
            });
        });
    }

    // Security Password Form
    if (securityForm) {
        securityForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const currPass = document.getElementById("profile-curr-pass").value;
            const newPass = document.getElementById("profile-new-pass").value;
            const newPassConfirm = document.getElementById("profile-new-pass-confirm").value;

            if (newPass !== newPassConfirm) {
                Swal.fire({
                    icon: "error",
                    title: "Update Failed",
                    text: "Confirm password does not match the new password.",
                    confirmButtonColor: "#132238"
                });
                return;
            }

            if (newPass.length < 6) {
                Swal.fire({
                    icon: "error",
                    title: "Weak Password",
                    text: "Password must be at least 6 characters.",
                    confirmButtonColor: "#132238"
                });
                return;
            }

            const firebaseUser = window.tvAuth.currentUser;
            if (!firebaseUser || !currentUser.email) {
                Swal.fire({
                    icon: "error",
                    title: "Update Failed",
                    text: "Unable to verify your session. Please sign in again.",
                    confirmButtonColor: "#132238"
                });
                return;
            }

            const credential = firebase.auth.EmailAuthProvider.credential(currentUser.email, currPass);
            firebaseUser.reauthenticateWithCredential(credential)
                .then(function () { return firebaseUser.updatePassword(newPass); })
                .then(function () {
                    Swal.fire({
                        icon: "success",
                        title: "Password Updated",
                        text: "Your account password was successfully updated.",
                        showConfirmButton: false,
                        timer: 1500
                    });

                    document.getElementById("profile-curr-pass").value = "";
                    document.getElementById("profile-new-pass").value = "";
                    document.getElementById("profile-new-pass-confirm").value = "";
                })
                .catch(function (err) {
                    var msg = "An error occurred. Please try again.";
                    if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
                        msg = "The current password you entered is incorrect.";
                    } else if (err.code === "auth/weak-password") {
                        msg = "Password is too weak. Use at least 6 characters.";
                    } else if (err.code === "auth/requires-recent-login") {
                        msg = "Please sign out and sign in again before changing your password.";
                    }
                    Swal.fire({
                        icon: "error",
                        title: "Update Failed",
                        text: msg,
                        confirmButtonColor: "#132238"
                    });
                });
        });
    }
}
