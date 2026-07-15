#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import * as p from "@clack/prompts";
import color from "picocolors";

const cliDir = path.dirname(fileURLToPath(import.meta.url));
const { version } = createRequire(import.meta.url)("./package.json");

const LANGUAGES = {
  typescript: { label: "TypeScript", dir: "ts" },
  javascript: { label: "JavaScript", dir: "js" },
};

const STARTERS = {
  blank: { label: "Blank" },
  example: { label: "Example" },
};

// Dependencies each option adds on top of the blank base — merged into the
// generated package.json instead of shipping a package.json copy per variant.
const EXAMPLE_DEPENDENCIES = {
  zod: "^4.4.3",
};

const DATABASES = {
  none: { label: "no database" },
  mongodb: {
    label: "MongoDB",
    dependencies: { mongoose: "^9.7.4" },
  },
  prisma: {
    label: "Prisma",
    dependencies: {
      "@prisma/client": "^7.8.0",
      "@prisma/adapter-pg": "^7.8.0",
    },
    devDependencies: { prisma: "^7.8.0" },
    scripts: { "db:push": "prisma db push", postinstall: "prisma generate" },
  },
};

const sortKeys = (obj) =>
  Object.fromEntries(
    Object.keys(obj)
      .sort()
      .map((key) => [key, obj[key]]),
  );

const REPO_URL = "https://github.com/thefordz/oliang";

const isValidPackageName = (name) => /^[a-z0-9][a-z0-9._-]*$/.test(name);

const exitCancelled = () => {
  p.cancel("Cancelled. Nothing was created.");
  process.exit(1);
};

const parseArgs = (argv) => {
  const parsed = {
    projectName: undefined,
    language: undefined,
    starter: undefined,
    includeHttp: undefined,
    database: undefined,
  };
  for (const arg of argv) {
    if (arg === "--typescript" || arg === "--ts") parsed.language = "typescript";
    else if (arg === "--javascript" || arg === "--js") parsed.language = "javascript";
    else if (arg === "--blank") parsed.starter = "blank";
    else if (arg === "--example") parsed.starter = "example";
    else if (arg === "--http") parsed.includeHttp = true;
    else if (arg === "--no-http") parsed.includeHttp = false;
    else if (arg === "--mongodb") parsed.database = "mongodb";
    else if (arg === "--prisma") parsed.database = "prisma";
    else if (arg === "--no-db") parsed.database = "none";
    else if (!arg.startsWith("-") && !parsed.projectName) parsed.projectName = arg;
  }
  return parsed;
};

// Empty template folders ship a "_gitkeep" placeholder (npm strips dotfiles
// on publish). Restore it to ".gitkeep", or drop it when the folder got real
// files from the example overlay.
const restoreGitkeeps = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) restoreGitkeeps(path.join(dir, entry.name));
  }
  const entries = fs.readdirSync(dir);
  if (!entries.includes("_gitkeep")) return;
  const placeholder = path.join(dir, "_gitkeep");
  if (entries.length === 1) {
    fs.renameSync(placeholder, path.join(dir, ".gitkeep"));
  } else {
    fs.rmSync(placeholder);
  }
};

async function main() {
  console.log();
  p.intro(
    `${color.bgCyan(color.black(" ☕ create-oliang "))} ${color.dim(`v${version}`)}` +
      `\n${color.dim("│  Express apps, brewed the Thai way")}`,
  );

  let { projectName, language, starter, includeHttp, database } = parseArgs(
    process.argv.slice(2),
  );
  const interactive = process.stdout.isTTY;

  if (!projectName) {
    if (!interactive) {
      p.cancel("Provide a project name: create-oliang <name>");
      process.exit(1);
    }
    const answer = await p.text({
      message: "Where should we brew your project?",
      placeholder: "my-oliang-app",
      validate: (value) => {
        if (!value) return "Project name is required.";
        if (!isValidPackageName(path.basename(path.resolve(value))))
          return "Use lowercase letters, numbers, dots, dashes and underscores.";
      },
    });
    if (p.isCancel(answer)) exitCancelled();
    projectName = answer;
  }

  if (!language) {
    if (interactive) {
      const answer = await p.select({
        message: "Which language would you like?",
        options: [
          { value: "typescript", label: "TypeScript", hint: "recommended" },
          { value: "javascript", label: "JavaScript" },
        ],
      });
      if (p.isCancel(answer)) exitCancelled();
      language = answer;
    } else {
      language = "typescript";
    }
  }

  if (!starter) {
    if (interactive) {
      const answer = await p.select({
        message: "How would you like to start?",
        options: [
          {
            value: "blank",
            label: "Blank",
            hint: "clean structure, ready to build",
          },
          {
            value: "example",
            label: "Example",
            hint: "users CRUD showing the full request flow",
          },
        ],
      });
      if (p.isCancel(answer)) exitCancelled();
      starter = answer;
    } else {
      starter = "blank";
    }
  }

  if (!database) {
    if (interactive) {
      const answer = await p.select({
        message: "Which database would you like?",
        options: [
          { value: "none", label: "None", hint: "in-memory, wire up your own later" },
          { value: "mongodb", label: "MongoDB", hint: "mongoose" },
          {
            value: "prisma",
            label: "Prisma ORM",
            hint: "PostgreSQL by default — swap provider anytime",
          },
        ],
      });
      if (p.isCancel(answer)) exitCancelled();
      database = answer;
    } else {
      database = "none";
    }
  }

  if (includeHttp === undefined) {
    if (interactive) {
      const answer = await p.confirm({
        message:
          "Add .http test files? (kulala.nvim / VS Code REST Client / JetBrains)",
        initialValue: true,
      });
      if (p.isCancel(answer)) exitCancelled();
      includeHttp = answer;
    } else {
      includeHttp = true;
    }
  }

  const targetDir = path.resolve(process.cwd(), projectName);
  const packageName = path.basename(targetDir);

  if (!isValidPackageName(packageName)) {
    p.cancel(`"${packageName}" is not a valid package name.`);
    process.exit(1);
  }

  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    p.cancel(`Directory "${projectName}" already exists and is not empty.`);
    process.exit(1);
  }

  const brewSpinner = p.spinner();
  brewSpinner.start("Brewing project files");

  const langDir = LANGUAGES[language].dir;
  fs.cpSync(path.join(cliDir, "templates", "blank", langDir), targetDir, {
    recursive: true,
  });
  if (starter === "example") {
    fs.cpSync(path.join(cliDir, "templates", "example", langDir), targetDir, {
      recursive: true,
    });
  }
  if (database !== "none") {
    fs.cpSync(
      path.join(cliDir, "templates", `db-${database}`, langDir),
      targetDir,
      { recursive: true },
    );
    if (starter === "example") {
      fs.cpSync(
        path.join(cliDir, "templates", `db-${database}-example`, langDir),
        targetDir,
        { recursive: true },
      );
    }
  }

  // npm strips dotfiles when publishing, so templates ship them with a
  // "_" prefix and we restore the real names here.
  fs.renameSync(
    path.join(targetDir, "_gitignore"),
    path.join(targetDir, ".gitignore"),
  );
  const envTemplate = path.join(targetDir, "_env");
  fs.copyFileSync(envTemplate, path.join(targetDir, ".env"));
  fs.renameSync(envTemplate, path.join(targetDir, ".env.example"));
  restoreGitkeeps(path.join(targetDir, "src"));

  if (!includeHttp) {
    fs.rmSync(path.join(targetDir, "http"), { recursive: true, force: true });
  }

  // Generated .env files reference the placeholder app name (e.g. the
  // MongoDB database name) — swap it for the real project name.
  for (const envFile of [".env", ".env.example"]) {
    const envPath = path.join(targetDir, envFile);
    const content = fs.readFileSync(envPath, "utf8");
    if (content.includes("oliang-app")) {
      fs.writeFileSync(envPath, content.replaceAll("oliang-app", packageName));
    }
  }

  const db = DATABASES[database];
  const pkgPath = path.join(targetDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.name = packageName;
  const extraDependencies = {
    ...(starter === "example" ? EXAMPLE_DEPENDENCIES : {}),
    ...(db.dependencies || {}),
  };
  if (Object.keys(extraDependencies).length > 0) {
    pkg.dependencies = sortKeys({ ...pkg.dependencies, ...extraDependencies });
  }
  if (db.devDependencies) {
    pkg.devDependencies = sortKeys({
      ...(pkg.devDependencies || {}),
      ...db.devDependencies,
    });
  }
  if (db.scripts) {
    pkg.scripts = { ...pkg.scripts, ...db.scripts };
  }
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  const dbSuffix =
    database === "none" ? "" : ` · ${color.cyan(DATABASES[database].label)}`;
  brewSpinner.stop(
    `${color.cyan(LANGUAGES[language].label)} · ${color.cyan(
      `${STARTERS[starter].label} starter`,
    )}${dbSuffix} → ${color.bold(`${projectName}/`)}`,
  );

  let installed = false;
  if (interactive) {
    const wantInstall = await p.confirm({
      message: "Install dependencies now?",
    });
    if (p.isCancel(wantInstall)) exitCancelled();

    if (wantInstall) {
      const installSpinner = p.spinner();
      installSpinner.start("Installing dependencies with npm");
      const result = spawnSync("npm", ["install"], {
        cwd: targetDir,
        stdio: "ignore",
        shell: process.platform === "win32",
      });
      if (result.status === 0) {
        installSpinner.stop("Dependencies installed.");
        installed = true;
      } else {
        installSpinner.stop(
          `Install failed — run ${color.cyan("npm install")} inside ${color.bold(
            projectName,
          )} to see what went wrong.`,
        );
      }
    }
  }

  if (starter === "example") {
    p.log.info(
      `Once running, try the example API:\n${color.dim(
        "curl http://localhost:3000/api/users",
      )}`,
    );
  }

  if (includeHttp) {
    p.log.info(
      `API test files live in ${color.cyan("http/")} — open them with\n${color.dim(
        "kulala.nvim, VS Code REST Client, or the JetBrains HTTP client.",
      )}`,
    );
  }

  if (database === "mongodb") {
    p.log.info(
      `MongoDB must be running before ${color.cyan("npm run dev")} —\n${color.dim(
        "set your own connection string in .env if it isn't mongodb://localhost:27017",
      )}`,
    );
  }

  if (database === "prisma") {
    p.log.info(
      `PostgreSQL must be running before ${color.cyan("npm run db:push")} —\n${color.dim(
        "set your own user/password in .env (default: postgres:postgres@localhost:5432)",
      )}`,
    );
  }

  const steps = [
    `cd ${projectName}`,
    !installed && "npm install",
    database === "mongodb" && "edit .env  # set DB_URL",
    database === "prisma" && "edit .env  # set DATABASE_URL",
    database === "prisma" && "npm run db:push",
    "npm run dev",
  ]
    .filter(Boolean)
    .map((step) => color.cyan(step))
    .join("\n");

  p.note(steps, "Next steps");

  p.outro(
    `Brewed and ready. Enjoy your oliang 🧋 ${color.dim(REPO_URL)}`,
  );
}

main().catch((error) => {
  p.cancel(error?.message || "Something went wrong.");
  process.exit(1);
});
