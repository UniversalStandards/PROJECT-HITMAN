{ pkgs }: {
  # Define the package
  buildInputs = with pkgs; [
    python3
    python3Packages.flask
    python3Packages.flask_sqlalchemy
    python3Packages.flask_migrate
    python3Packages.flask_script
    flask
    nodejs
    all
    replit
    replit.nix
    nix
    repl
    repl.nix
  ];

  # Specify additional environment variables
  shellHook = ''
    export FLASK_APP=app.py
    export FLASK_ENV=development
  '';

    deps = [
      pkgs.postgresql
      pkgs.gotools
      pkgs.cowsay
      pkgs.replit
      pkgs.python
      pkgs.bank
      pkgs.flask
      pkgs.nodejs
      pkgs.sql
      pkgs.packages
      pkgs.request
      pkgs.stdenv.hostPlatform
      pkgs.all
    ];
}