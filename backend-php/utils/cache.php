<?php
class Cache {
    private $cacheDir;
    
    public function __construct($cacheDir = __DIR__ . '/../cache') {
        $this->cacheDir = $cacheDir;
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0777, true);
        }
    }
    
    public function get($key) {
        $filename = $this->getCacheFilename($key);
        
        if (!file_exists($filename)) {
            return null;
        }
        
        $data = json_decode(file_get_contents($filename), true);
        
        if ($data['expires'] < time()) {
            unlink($filename);
            return null;
        }
        
        return $data['value'];
    }
    
    public function set($key, $value, $duration = null) {
        $duration = $duration ?: CACHE_DURATION;
        $filename = $this->getCacheFilename($key);
        
        $data = [
            'value' => $value,
            'expires' => time() + $duration
        ];
        
        file_put_contents($filename, json_encode($data));
    }
    
    public function clear($key = null) {
        if ($key) {
            $filename = $this->getCacheFilename($key);
            if (file_exists($filename)) {
                unlink($filename);
            }
        } else {
            $files = glob($this->cacheDir . '/*.json');
            foreach ($files as $file) {
                unlink($file);
            }
        }
    }
    
    private function getCacheFilename($key) {
        return $this->cacheDir . '/' . md5($key) . '.json';
    }
}
?>