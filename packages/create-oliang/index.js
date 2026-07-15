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
  };
  for (const arg of argv) {
    if (arg === "--typescript" || arg === "--ts") parsed.language = "typescript";
    else if (arg === "--javascript" || arg === "--js") parsed.language = "javascript";
    else if (arg === "--blank") parsed.starter = "blank";
    else if (arg === "--example") parsed.starter = "example";
    else if (arg === "--http") parsed.includeHttp = true;
    else if (arg === "--no-http") parsed.includeHttp = false;
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

  let { projectName, language, starter, includeHttp } = parseArgs(
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

  const pkgPath = path.join(targetDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.name = packageName;
  if (starter === "example") {
    const merged = { ...pkg.dependencies, ...EXAMPLE_DEPENDENCIES };
    pkg.dependencies = Object.fromEntries(
      Object.keys(merged)
        .sort()
        .map((key) => [key, merged[key]]),
    );
  }
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  brewSpinner.stop(
    `${color.cyan(LANGUAGES[language].label)} · ${color.cyan(
      `${STARTERS[starter].label} starter`,
    )} → ${color.bold(`${projectName}/`)}`,
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

  const steps = [
    `cd ${projectName}`,
    !installed && "npm install",
    "npm run dev",
  ]
    .filter(Boolean)
    .map((step) => color.cyan(step))
    .join("\n");

  p.note(steps, "Next steps");

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

  p.outro(
    `Brewed and ready. Enjoy your oliang 🧋 ${color.dim(REPO_URL)}`,
  );
}

main().catch((error) => {
  p.cancel(error?.message || "Something went wrong.");
  process.exit(1);
});
