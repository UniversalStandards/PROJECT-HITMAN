# !/bin/bash

# Exit on first error
set -e

# Function to print an error message and exit
error_exit()
{
    echo "$1" 1>&2
    exit 1
}

# Detect and run build commands based on the presence of specific files
if [ -f "./pom.xml" ]; then
    echo "Maven project detected. Building..."
    mvn clean install || error_exit "Maven build failed."
elif [ -f "./build.gradle" ] || [ -f "./build.gradle.kts" ]; then
    echo "Gradle project detected. Building..."
    ./gradlew build || error_exit "Gradle build failed."
elif [ -f "./Makefile" ]; then
    echo "Make project detected. Building..."
    make || error_exit "Make build failed."
elif [ -f "./CMakeLists.txt" ]; then
    echo "CMake project detected. Building..."
    mkdir -p build && cd build
    cmake .. && make || error_exit "CMake build failed."
elif [ -f "./setup.py" ]; then
    echo "Python project detected. Building..."
    python setup.py install || error_exit "Python build failed."
elif [ -f "./package.json" ]; then
    echo "Node.js project detected. Building..."
    npm install && npm run build || error_exit "Node.js build failed."
else
    echo "No known project files found. Please add custom build steps to this script."
    exit 1
fi

echo "Build successful."


### How It Works:

# 1. **Error Handling**: The script exits immediately if any command fails (`set -e`) and provides a function `error_exit` for printing error messages before exiting.

# 2. **Build System Detection**: The script checks for the presence of common build configuration files (e.g., `pom.xml` for Maven, `build.gradle` for Gradle, `Makefile` for make, etc.). When it finds a recognized file, it assumes the corresponding build system is used and executes the standard build command for that system.

# 3. **Customization**: You should modify and extend this script based on the specific needs of your projects or add more clauses to handle other build systems.

# 4. **Fallback**: If the script does not detect a known configuration file, it exits with a message prompting you to add custom build steps.

### Usage:

# 1. Place this script in the root directory of your project.
# 2. Make sure it is executable: `chmod +x buildscript.sh`
#3. Run it: `./buildscript.sh`
