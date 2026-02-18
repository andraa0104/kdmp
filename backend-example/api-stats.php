<?php
// Contoh API Endpoint untuk Laravel
// File: routes/api.php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::get('/stats', function () {
    // Query untuk menghitung total anggota aktif
    $totalAnggota = DB::table('anggota')
        ->where('status', 'aktif')
        ->count();
    
    // Query untuk menghitung pertumbuhan anggota (bulan ini vs bulan lalu)
    $anggotaBulanIni = DB::table('anggota')
        ->whereMonth('created_at', date('m'))
        ->whereYear('created_at', date('Y'))
        ->count();
    
    $anggotaBulanLalu = DB::table('anggota')
        ->whereMonth('created_at', date('m', strtotime('-1 month')))
        ->whereYear('created_at', date('Y', strtotime('-1 month')))
        ->count();
    
    $pertumbuhanPersen = $anggotaBulanLalu > 0 
        ? round((($anggotaBulanIni - $anggotaBulanLalu) / $anggotaBulanLalu) * 100, 1)
        : 0;
    
    // Query untuk menghitung total aset
    $totalAset = DB::table('inventaris')
        ->where('status', 'aktif')
        ->sum('nilai_buku_sekarang');
    
    // Tambahkan simpanan anggota
    $totalSimpanan = DB::table('iuran_pokok')->sum('nominal') 
                   + DB::table('iuran_wajib')->sum('nominal')
                   + DB::table('simpanan_sukarela')->sum('nominal');
    
    $totalAset += $totalSimpanan;
    
    return response()->json([
        'totalAnggota' => $totalAnggota,
        'pertumbuhanPersen' => $pertumbuhanPersen,
        'totalAset' => $totalAset
    ]);
});
