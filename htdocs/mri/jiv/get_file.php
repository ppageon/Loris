<?php
/**
 * Controls access to files on the filesystem. This script should ensure that
 * only files relative to the paths specified in the config.xml are accessible.
 * By calling new NDB_Client(), it also makes sure that the user is logged in to
 * Loris.
 *
 * It also does validation to make sure said paths are specified and not set to /
 * for security reasons.
 *
 * Used by MRI Browser and (old) Data Query GUI.
 *
 * PHP Version 5
 *
 *  @category Loris
 *  @package  MRI
 *  @author   Dave MacFarlane <driusan@bic.mni.mcgill.ca>
 *  @license  Loris license
 *  @link     https://github.com/aces/Loris-Trunk
 */



// Load config file and ensure paths are correct
set_include_path(
    get_include_path() . ":../../../project/libraries:../../../php/libraries"
);
require_once __DIR__ . "/../../../vendor/autoload.php";
// Since we're sending binary data, we don't want PHP to print errors or warnings
// inline. They'll still show up in the Apache logs.
ini_set("display_errors", "Off");

// Ensures the user is logged in, and parses the config file.
require_once "NDB_Client.class.inc";
$client = new NDB_Client();
if ($client->initialize("../../../project/config.xml") == false) {
    return false;
}

// Checks that config settings are set
$config   =& NDB_Config::singleton();
$paths    = $config->getSetting('paths');
$pipeline = $config->getSetting('imaging_pipeline');

// Basic config validation
$imagePath    = $paths['imagePath'];
$DownloadPath = $paths['DownloadPath'];
$mincPath     = $paths['mincPath'];
$tarchivePath = $pipeline['tarchiveLibraryDir'];
if (empty($imagePath) || empty($DownloadPath)
    || empty($mincPath) || empty($tarchivePath)
) {
    error_log("ERROR: Config settings are missing");
    header("HTTP/1.1 500 Internal Server Error");
    exit(1);
}

if ($imagePath === '/' || $DownloadPath === '/'
    || $mincPath === '/' || $tarchivePath === '/'
) {
    error_log("ERROR: Path can not be root for security reasons.");
    header("HTTP/1.1 500 Internal Server Error");
    exit(2);
}

// Now get the file and do file validation.
// Resolve the filename before doing anything.
$File = Utility::resolvePath($_GET['file']);
// Extra sanity checks, just in case something went wrong with path resolution.
// File validation
if (strpos($File, ".") === false) {
    error_log("ERROR: Could not determine file type.");
    header("HTTP/1.1 400 Bad Request");
    exit(3);
}

// Find the extension
$path_parts = pathinfo($File);
$FileExt    = $path_parts['extension'];
$FileBase   = $path_parts['basename'];

//make sure that we have a .nii.gz image if FileExt equal gz
if (strcmp($FileExt, "gz") == 0) {
    $path_subparts = pathinfo($path_parts['filename']);
    if (strcmp($path_subparts['extension'], "nii")==0) {
        $FileExt = "nii.gz";
    }
}
unset($path_parts);

// Make sure that the user isn't trying to break out of the $path by
// using a relative filename.
// No need to check for '/' since all downloads are relative to $imagePath,
// $DownloadPath or $mincPath
if (strpos($File, "..") !== false) {
    error_log("ERROR: Invalid filename");
    header("HTTP/1.1 400 Bad Request");
    exit(4);
}

// If basename of $File starts with "DCM_", prefix automatically
// inserted by the LORIS-MRI pipeline, identify it as $FileExt:
// "DICOMTAR"
// Caveat: this is not a real file extension, but a LORIS-MRI
// convention to identify archived DICOMs
if (strpos($FileBase, "DCM_") === 0) {
    $FileExt = "DICOMTAR";
}

switch($FileExt) {
case 'mnc':
    $FullPath         = $mincPath . '/' . $File;
    $MimeType         = "application/x-minc";
    $DownloadFilename = basename($File);
    break;
case 'nii':
    $FullPath         = $mincPath . '/' . $File;
    $MimeType         = "application/x-nifti";
    $DownloadFilename = basename($File);
    break;
case 'nii.gz':
    $FullPath         = $mincPath . '/' . $File;
    $MimeType         = "application/x-nifti-gz";
    $DownloadFilename = basename($File);
    break;
case 'png':
    $FullPath = $imagePath . '/' . $File;
    $MimeType = "image/png";
    break;
case 'jpg':
    $FullPath = $imagePath . '/' . $File;
    $MimeType = "image/jpeg";
    break;
case 'header':
case 'raw_byte.gz':
    // JIVs are relative to imagePath for historical reasons
    // And they don't have a real mime type.
    $FullPath = $imagePath . '/' . $File;
    $MimeType = 'application/octet-stream';
    break;
case 'xml':
    $FullPath         = $imagePath . '/' . $File;
    $MimeType         = 'application/xml';
    $DownloadFilename = basename($File);
    break;
case 'nrrd':
    $FullPath         = $imagePath . '/' . $File;
    $MimeType         = 'image/vnd.nrrd';
    $DownloadFilename = basename($File);
    break;
case 'DICOMTAR':
    // ADD case for DICOMTAR
    $FullPath         = $tarchivePath . '/' . $File;
    $MimeType         = 'application/x-tar';
    $DownloadFilename = basename($File);
    $PatientName      = $_GET['patientName'] ?? '';
    break;
default:
    $FullPath         = $DownloadPath . '/' . $File;
    $MimeType         = 'application/octet-stream';
    $DownloadFilename = basename($File);
    break;
}

if (!file_exists($FullPath)) {
    error_log("ERROR: File $FullPath does not exist");
    header("HTTP/1.1 404 Not Found");
    exit(5);
}

header("Content-type: $MimeType");
if (!empty($DownloadFilename)) {
    // Prepend the patient name to the beginning of the file name.
    if ($FileExt === 'DICOMTAR' && !empty($PatientName)) {
        /* Format: $Filename_$PatientName.extension
         *
         * basename() is used around $PatientName to prevent the use of
         * relative path traversal characters.
         */

        $DownloadFilename = basename($PatientName) .
            '_' .
            pathinfo($DownloadFilename, PATHINFO_FILENAME) .
            '.' .
            pathinfo($DownloadFilename, PATHINFO_EXTENSION);

    }
    header("Content-Disposition: attachment; filename=$DownloadFilename");
}
$fp = fopen($FullPath, 'r');
fpassthru($fp);
fclose($fp);
?>
