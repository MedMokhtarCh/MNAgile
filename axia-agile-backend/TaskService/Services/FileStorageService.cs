namespace TaskService.Services
{
    public class FileStorageService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<FileStorageService> _logger;
        private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

        public FileStorageService(IWebHostEnvironment environment, ILogger<FileStorageService> logger)
        {
            _environment = environment ?? throw new ArgumentNullException(nameof(environment));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<string> SaveFileAsync(IFormFile file)
        {
            if (file == null)
            {
                _logger.LogError("SaveFileAsync: File is null");
                throw new ArgumentNullException(nameof(file), "The file cannot be null.");
            }

            if (string.IsNullOrEmpty(file.FileName))
            {
                _logger.LogError("SaveFileAsync: File has no name");
                throw new ArgumentException("The file must have a name.", nameof(file));
            }

            if (file.Length == 0)
            {
                _logger.LogError($"SaveFileAsync: File {file.FileName} is empty");
                throw new ArgumentException($"The file {file.FileName} is empty.", nameof(file));
            }

            if (file.Length > MaxFileSize)
            {
                _logger.LogError($"SaveFileAsync: File {file.FileName} size {file.Length} bytes exceeds limit");
                throw new ArgumentException($"The file size exceeds the limit of {MaxFileSize / (1024 * 1024)} MB.", nameof(file));
            }

            try
            {
                var webRootPath = _environment.WebRootPath;
                _logger.LogDebug($"WebRootPath: {webRootPath}");

                var uploadsFolder = Path.Combine(webRootPath, "Uploads");
                if (!Directory.Exists(uploadsFolder))
                {
                    _logger.LogInformation($"Creating uploads folder: {uploadsFolder}");
                    Directory.CreateDirectory(uploadsFolder);
                }

                var fileExtension = Path.GetExtension(file.FileName);
                var fileName = $"{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(uploadsFolder, fileName);

                _logger.LogDebug($"Saving file {file.FileName} to {filePath}");

                using (var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None, 4096, true))
                {
                    await file.CopyToAsync(fileStream);
                }

                _logger.LogInformation($"File {file.FileName} saved successfully as {fileName}");
                return $"/Uploads/{fileName}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error saving file {file.FileName}");
                throw new InvalidOperationException($"Error saving file: {ex.Message}", ex);
            }
        }
    }
}