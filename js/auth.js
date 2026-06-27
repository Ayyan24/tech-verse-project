// Tech Verse — Authentication (Firebase Auth)

document.addEventListener("DOMContentLoaded", function () {
    var loginForm   = document.getElementById("login-form");
    var signupForm  = document.getElementById("signup-form");
    var path        = window.location.pathname;
    var isRoot      = path.indexOf("/buyer/") === -1 && path.indexOf("/vendor/") === -1 && path.indexOf("/admin/") === -1;
    var prefix      = isRoot ? "" : "../";

    function resolveEmailFromLoginId(loginId, callback) {
        if (loginId.indexOf("@") !== -1) {
            callback(null, loginId);
            return;
        }

        function lookupUsers() {
            var users = window.TechcartDB.getUsers();
            var matched = users.find(function (u) {
                return (u.username || "").toLowerCase() === loginId;
            });
            if (!matched) {
                callback(new Error("not-found"));
                return;
            }
            callback(null, matched.email);
        }

        if (window.TechcartDB.isAdminCacheReady()) {
            lookupUsers();
        } else {
            window.TechcartDB.onAdminCacheReady(lookupUsers);
        }
    }

    function performSignIn(emailToUse, password, submitBtn) {
        submitBtn.disabled = true;

        window.tvAuth.signInWithEmailAndPassword(emailToUse, password)
            .then(function (credential) {
                var uid = credential.user.uid;
                return window.tvFirestore.collection("users").doc(uid).get();
            })
            .then(function (doc) {
                var userData = doc.exists
                    ? Object.assign({ id: doc.id }, doc.data())
                    : { id: window.tvAuth.currentUser.uid, role: "buyer", name: window.tvAuth.currentUser.email };

                Swal.fire({
                    icon: "success",
                    title: "Welcome, " + userData.name + "!",
                    showConfirmButton: false,
                    timer: 1500
                }).then(function () {
                    redirectByRole(userData.role, prefix);
                });
            })
            .catch(function (err) {
                submitBtn.disabled = false;
                var msg = "An error occurred. Please try again.";
                if (err.code === "auth/user-not-found" || err.code === "auth/invalid-email") {
                    msg = "No account found with this email or ID.";
                } else if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
                    msg = "Incorrect password. Please try again.";
                } else if (err.code === "auth/too-many-requests") {
                    msg = "Too many failed attempts. Please wait a moment and try again.";
                }
                Swal.fire({ icon: "error", title: "Sign In Failed", text: msg, confirmButtonColor: "#132238" });
            });
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            var loginId  = document.getElementById("email").value.trim().toLowerCase();
            var password = document.getElementById("password").value;
            var submitBtn = loginForm.querySelector("button[type=submit]");

            resolveEmailFromLoginId(loginId, function (err, emailToUse) {
                if (err) {
                    Swal.fire({
                        icon: "error",
                        title: "Account Not Found",
                        text: "No account matches this email or admin ID.",
                        confirmButtonColor: "#132238"
                    });
                    return;
                }

                performSignIn(emailToUse, password, submitBtn);
            });
        });
    }

    // ── Sign Up ───────────────────────────────────────────────────────────────
    if (signupForm) {
        signupForm.addEventListener("submit", function (e) {
            e.preventDefault();
            var name    = document.getElementById("name").value.trim();
            var email   = document.getElementById("email").value.trim().toLowerCase();
            var role    = document.getElementById("role").value;
            var password = document.getElementById("password").value;
            var confirm  = document.getElementById("confirm-password").value;

            if (password !== confirm) {
                Swal.fire({ icon: "error", title: "Passwords do not match", confirmButtonColor: "#132238" });
                return;
            }
            if (password.length < 6) {
                Swal.fire({ icon: "error", title: "Weak Password", text: "Password must be at least 6 characters.", confirmButtonColor: "#132238" });
                return;
            }

            signupForm.querySelector("button[type=submit]").disabled = true;

            window.tvAuth.createUserWithEmailAndPassword(email, password)
                .then(function (credential) {
                    var uid = credential.user.uid;

                    // Update Firebase Auth display name
                    credential.user.updateProfile({ displayName: name });

                    // Create user document in Firestore
                    var newUser = {
                        id:        uid,
                        username:  "",
                        name:      name,
                        email:     email,
                        role:      role,
                        address:   "",
                        city:      "",
                        phone:     ""
                    };
                    if (role === "vendor") newUser.shopName = name + "'s Shop";

                    return window.TechcartDB.registerUserProfile(newUser).then(function () {
                        return newUser;
                    });
                })
                .then(function (newUser) {
                    Swal.fire({
                        icon: "success",
                        title: "Account Created!",
                        showConfirmButton: false,
                        timer: 1500
                    }).then(function () {
                        redirectByRole(role, prefix);
                    });
                })
                .catch(function (err) {
                    signupForm.querySelector("button[type=submit]").disabled = false;
                    var msg = "An error occurred. Please try again.";
                    if (err.code === "auth/email-already-in-use") {
                        msg = "This email is already registered. Please sign in instead.";
                    } else if (err.code === "auth/invalid-email") {
                        msg = "Please enter a valid email address.";
                    } else if (err.code === "auth/weak-password") {
                        msg = "Password is too weak. Use at least 6 characters.";
                    } else if (err.code === "permission-denied") {
                        msg = "Could not save your profile. Check Firestore rules in Firebase Console.";
                    }
                    Swal.fire({ icon: "error", title: "Registration Failed", text: msg, confirmButtonColor: "#132238" });
                });
        });
    }
});

function redirectByRole(role, prefix) {
    if (role === "admin")  window.location.href = prefix + "admin/dashboard.html";
    else if (role === "vendor") window.location.href = prefix + "vendor/dashboard.html";
    else window.location.href = prefix + "index.html";
}
