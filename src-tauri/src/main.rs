// ═════════════════════════════════════════════════════════════════════════════
// PXLS EDITOR - TAURI BACKEND
// Rust backend for the Pexels image editor desktop application
// ═════════════════════════════════════════════════════════════════════════════

// Prevents additional console window on Windows in release builds
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
