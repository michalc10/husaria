import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { forkJoin } from 'rxjs';
import { IBattle, IBattleCategory, IBattleObstacle, IBattlePenalty, IScoreOption } from 'src/app/models/battle';
import { ICompetitionTemplate } from 'src/app/models/competitionTemplate';
import { CompetitionTemplateService } from '../../services/competition-template/competition-template.service';
import { TournamentService } from '../../services/tournament/tournament.service';

@Component({
  selector: 'app-competition',
  templateUrl: './competition.component.html',
  styleUrls: ['./competition.component.scss'],
  standalone: false
})
export class CompetitionComponent implements OnInit {
  tournamentId = '';
  battles: IBattle[] = [];
  templates: ICompetitionTemplate[] = [];
  selectedTemplateId = '';
  saveTemplateDialogVisible = false;
  replaceTemplateDialogVisible = false;
  deleteTemplateDialogVisible = false;
  templateName = '';
  templateDescription = '';
  submittedTemplate = false;
  templateToDelete: ICompetitionTemplate | null = null;

  private collapsedBattles = new Set<string>();
  private collapsedCategories = new Set<string>();
  private savedBattlesSnapshot = '';
  private pendingReplacementTemplate: ICompetitionTemplate | null = null;
  private replaceAfterTemplateSave = false;
  private templateSaveCompleted = false;
  private switchingReplacementDialogToSave = false;

  constructor(
    private tournamentService: TournamentService,
    private competitionTemplateService: CompetitionTemplateService,
    private router: Router,
    private route: ActivatedRoute,
    private transloco: TranslocoService
  ) {}

  ngOnInit(): void {
    const tournamentId = this.route.parent?.snapshot.paramMap.get('idTournament');
    if (!tournamentId) return;

    this.tournamentId = tournamentId;
    forkJoin({
      battles: this.tournamentService.getBattles(tournamentId),
      templates: this.competitionTemplateService.list()
    }).subscribe({
      next: ({ battles, templates }) => {
        this.battles = battles;
        this.templates = templates;
        this.selectedTemplateId = templates[0]?._id || '';
        this.captureSavedSnapshot();
        this.collapseAllBattles();
      },
      error: (error) => {
        console.error(this.transloco.translate('competition.loadError'), error);
        this.battles = [];
        this.templates = [];
        this.captureSavedSnapshot();
        this.clearCollapseState();
      }
    });
  }

  get selectedTemplate(): ICompetitionTemplate | null {
    return this.templates.find(item => item._id === this.selectedTemplateId) || null;
  }

  save(): void {
    const battles = this.normalizeBattles(this.battles);

    this.tournamentService.saveBattles(this.tournamentId, battles).subscribe({
      next: () => {
        this.battles = battles;
        this.captureSavedSnapshot();
        const currentUrl = this.router.url;
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigateByUrl(currentUrl);
        });
      },
      error: (error) => {
        console.error(this.transloco.translate('competition.saveError'), error);
        alert(this.transloco.translate('competition.saveErrorAlert'));
      }
    });
  }

  startBlank(): void {
    this.battles = [this.newBattle(1)];
    this.collapseAllBattles();
  }

  applyTemplate(template: ICompetitionTemplate): void {
    this.requestTemplateReplacement(template);
  }

  replaceWithSelectedTemplate(): void {
    const template = this.selectedTemplate;
    if (!template) return;

    this.requestTemplateReplacement(template);
  }

  openSaveTemplateDialog(replaceAfterSave = false): void {
    this.templateName = '';
    this.templateDescription = '';
    this.submittedTemplate = false;
    this.replaceAfterTemplateSave = replaceAfterSave;
    this.templateSaveCompleted = false;
    this.saveTemplateDialogVisible = true;
  }

  closeSaveTemplateDialog(): void {
    this.saveTemplateDialogVisible = false;
    if (this.replaceAfterTemplateSave) {
      this.clearPendingReplacement();
    }
  }

  onSaveTemplateDialogHide(): void {
    if (!this.templateSaveCompleted && this.replaceAfterTemplateSave) {
      this.clearPendingReplacement();
    }
  }

  saveAsTemplate(): void {
    this.submittedTemplate = true;
    const name = this.templateName.trim();
    if (!name || !this.battles.length) return;

    this.competitionTemplateService.create({
      name,
      description: this.templateDescription.trim(),
      battles: this.stripIds(this.normalizeBattles(this.battles))
    }).subscribe({
      next: (template) => {
        const pendingTemplate = this.replaceAfterTemplateSave ? this.pendingReplacementTemplate : null;
        this.templateSaveCompleted = true;
        this.clearPendingReplacement();
        this.saveTemplateDialogVisible = false;
        this.loadTemplates(template._id);

        if (pendingTemplate) {
          this.replaceWithTemplate(pendingTemplate);
        }
      },
      error: (error) => {
        console.error(this.transloco.translate('competition.templateSaveError'), error);
        alert(this.transloco.translate('competition.templateSaveError'));
      }
    });
  }

  overwriteSelectedTemplate(): void {
    const template = this.selectedTemplate;
    if (!template?._id || !this.battles.length) return;

    this.competitionTemplateService.update(template._id, {
      name: template.name,
      description: template.description || '',
      battles: this.stripIds(this.normalizeBattles(this.battles))
    }).subscribe({
      next: (updated) => this.loadTemplates(updated._id),
      error: (error) => {
        console.error(this.transloco.translate('competition.templateOverwriteError'), error);
        alert(this.transloco.translate('competition.templateOverwriteError'));
      }
    });
  }

  requestDeleteSelectedTemplate(): void {
    const template = this.selectedTemplate;
    if (!template?._id) return;

    this.templateToDelete = template;
    this.deleteTemplateDialogVisible = true;
  }

  deleteSelectedTemplate(): void {
    const template = this.templateToDelete;
    if (!template?._id) return;

    this.competitionTemplateService.delete(template._id).subscribe({
      next: () => {
        this.deleteTemplateDialogVisible = false;
        this.templateToDelete = null;
        this.loadTemplates();
      },
      error: (error) => {
        console.error(this.transloco.translate('competition.templateDeleteError'), error);
        alert(this.transloco.translate('competition.templateDeleteError'));
      }
    });
  }

  cancelDeleteTemplate(): void {
    this.deleteTemplateDialogVisible = false;
    this.templateToDelete = null;
  }

  discardAndReplaceTemplate(): void {
    if (!this.pendingReplacementTemplate) return;

    this.replaceWithTemplate(this.pendingReplacementTemplate);
    this.clearPendingReplacement();
  }

  saveCurrentAsTemplateBeforeReplace(): void {
    this.switchingReplacementDialogToSave = true;
    this.replaceTemplateDialogVisible = false;
    this.openSaveTemplateDialog(true);
  }

  cancelTemplateReplacement(): void {
    this.clearPendingReplacement();
  }

  onReplaceTemplateDialogHide(): void {
    if (this.switchingReplacementDialogToSave) {
      this.switchingReplacementDialogToSave = false;
      return;
    }

    this.cancelTemplateReplacement();
  }

  addBattle(): void {
    this.battles = [...this.battles, this.newBattle(this.battles.length + 1)];
    this.collapseAllBattles();
  }

  removeBattle(battleIndex: number): void {
    this.battles.splice(battleIndex, 1);
    this.battles = [...this.battles];
    this.collapseAllBattles();
  }

  addCategory(battleIndex: number): void {
    const battle = this.battles[battleIndex];
    battle.categories.push(this.newCategory(battle.categories.length + 1));
  }

  removeCategory(battleIndex: number, categoryIndex: number): void {
    this.battles[battleIndex].categories.splice(categoryIndex, 1);
  }

  addObstacle(battleIndex: number, categoryIndex: number): void {
    const category = this.battles[battleIndex].categories[categoryIndex];
    category.obstacles.push(this.newObstacle(category.obstacles.length + 1));
  }

  removeObstacle(battleIndex: number, categoryIndex: number, obstacleIndex: number): void {
    this.battles[battleIndex].categories[categoryIndex].obstacles.splice(obstacleIndex, 1);
  }

  addPenalty(battleIndex: number): void {
    const battle = this.battles[battleIndex];
    battle.penalties.push({
      name: this.transloco.translate('competition.newPenalty'),
      order: battle.penalties.length + 1,
      score: 0
    });
  }

  removePenalty(battleIndex: number, penaltyIndex: number): void {
    this.battles[battleIndex].penalties.splice(penaltyIndex, 1);
  }

  toggleBattle(battle: IBattle, battleIndex: number): void {
    this.toggleSet(this.collapsedBattles, this.battleKey(battle, battleIndex));
  }

  toggleCategory(battle: IBattle, battleIndex: number, category: IBattleCategory, categoryIndex: number): void {
    this.toggleSet(this.collapsedCategories, this.categoryKey(battle, battleIndex, category, categoryIndex));
  }

  isBattleCollapsed(battle: IBattle, battleIndex: number): boolean {
    return this.collapsedBattles.has(this.battleKey(battle, battleIndex));
  }

  isCategoryCollapsed(battle: IBattle, battleIndex: number, category: IBattleCategory, categoryIndex: number): boolean {
    return this.collapsedCategories.has(this.categoryKey(battle, battleIndex, category, categoryIndex));
  }

  battleObstacleCount(battle: IBattle): number {
    return battle.categories.reduce((total, category) => total + category.obstacles.length, 0);
  }

  trackBattle(index: number, battle: IBattle): string {
    return battle._id || `battle-${index}`;
  }

  trackCategory(index: number, category: IBattleCategory): string {
    return category._id || `category-${index}`;
  }

  trackObstacle(index: number, obstacle: IBattleObstacle): string {
    return obstacle._id || `obstacle-${index}`;
  }

  trackPenalty(index: number, penalty: IBattlePenalty): string {
    return penalty._id || `penalty-${index}`;
  }

  syncScore(obstacle: IBattleObstacle): void {
    const normalized = this.normalizeObstacle(obstacle);
    obstacle.inputType = normalized.inputType;
    obstacle.score = normalized.score;
    obstacle.scoreOptions = normalized.scoreOptions;
  }

  private normalizeBattles(battles: IBattle[]): IBattle[] {
    return battles.map((battle, battleIndex) => ({
      _id: battle._id,
      name: battle.name,
      order: battleIndex + 1,
      categories: battle.categories.map((category, categoryIndex) => {
        const categoryOrder = categoryIndex + 1;

        return {
          _id: category._id,
          name: category.name,
          order: categoryOrder,
          obstacles: category.obstacles.map((obstacle, obstacleIndex) => {
            const normalized = this.normalizeObstacle({
              ...obstacle,
              order: obstacleIndex + 1
            });

            return {
              _id: obstacle._id,
              name: normalized.name,
              order: normalized.order,
              inputType: normalized.inputType,
              score: normalized.score,
              scoreRaw: normalized.scoreRaw,
              scoreOptions: normalized.scoreOptions
            };
          })
        };
      }),
      penalties: battle.penalties.map((penalty, penaltyIndex) => ({
        _id: penalty._id,
        name: penalty.name,
        order: penaltyIndex + 1,
        score: Number(penalty.score || 0)
      }))
    }));
  }

  private normalizeObstacle(obstacle: IBattleObstacle): IBattleObstacle {
    const scoreRaw = String(obstacle.scoreRaw || obstacle.score || '0').trim();

    if (scoreRaw.includes('-')) {
      return {
        ...obstacle,
        inputType: 'select',
        score: 0,
        scoreRaw,
        scoreOptions: this.optionsFromScoreRaw(scoreRaw)
      };
    }

    return {
      ...obstacle,
      inputType: 'toggle',
      score: Number(scoreRaw || 0),
      scoreRaw,
      scoreOptions: undefined
    };
  }

  private optionsFromScoreRaw(scoreRaw: string): IScoreOption[] {
    return scoreRaw.split('-').map((score, index) => ({
      code: String(index),
      label: String(index),
      score: Number(score || 0)
    }));
  }

  private requestTemplateReplacement(template: ICompetitionTemplate): void {
    if (this.hasUnsavedChanges()) {
      this.pendingReplacementTemplate = template;
      this.replaceTemplateDialogVisible = true;
      return;
    }

    this.replaceWithTemplate(template);
  }

  private replaceWithTemplate(template: ICompetitionTemplate): void {
    this.battles = this.cloneTemplateBattles(template, 1);
    this.collapseAllBattles();
  }

  private cloneTemplateBattles(template: ICompetitionTemplate, startOrder: number): IBattle[] {
    return this.stripIds(template.battles || []).map((battle, battleIndex) => ({
      ...battle,
      order: startOrder + battleIndex
    }));
  }

  private stripIds(battles: IBattle[]): IBattle[] {
    return battles.map((battle, battleIndex) => ({
      name: battle.name,
      order: battleIndex + 1,
      categories: (battle.categories || []).map((category, categoryIndex) => ({
        name: category.name,
        order: categoryIndex + 1,
        obstacles: (category.obstacles || []).map((obstacle, obstacleIndex) => ({
          name: obstacle.name,
          order: obstacleIndex + 1,
          inputType: obstacle.inputType,
          score: Number(obstacle.score || 0),
          scoreRaw: obstacle.scoreRaw || String(obstacle.score || 0),
          scoreOptions: obstacle.scoreOptions
        }))
      })),
      penalties: (battle.penalties || []).map((penalty, penaltyIndex) => ({
        name: penalty.name,
        order: penaltyIndex + 1,
        score: Number(penalty.score || 0)
      }))
    }));
  }

  private newBattle(order: number): IBattle {
    return {
      name: this.transloco.translate('competition.battle', { index: order }),
      order,
      categories: [this.newCategory(1)],
      penalties: this.defaultPenalties()
    };
  }

  private newCategory(order: number): IBattleCategory {
    return {
      name: `${this.transloco.translate('competition.category')} ${order}`,
      order,
      obstacles: [this.newObstacle(1)]
    };
  }

  private newObstacle(order: number): IBattleObstacle {
    return {
      name: `${this.transloco.translate('competition.obstacle')} ${order}`,
      order,
      inputType: 'toggle',
      score: 0,
      scoreRaw: '0'
    };
  }

  private defaultPenalties(): IBattlePenalty[] {
    return [
      { name: 'Utrata broni', order: 1, score: 5 },
      { name: 'Upadek jeźdźca', order: 2, score: 20 },
      { name: 'Upadek konia i jeźdźca', order: 3, score: 40 }
    ];
  }

  private battleKey(battle: IBattle, battleIndex: number): string {
    return battle._id || `battle-${battleIndex}`;
  }

  private categoryKey(battle: IBattle, battleIndex: number, category: IBattleCategory, categoryIndex: number): string {
    return `${this.battleKey(battle, battleIndex)}:${category._id || `category-${categoryIndex}`}`;
  }

  private toggleSet(set: Set<string>, key: string): void {
    set.has(key) ? set.delete(key) : set.add(key);
  }

  private loadTemplates(selectedTemplateId?: string): void {
    this.competitionTemplateService.list().subscribe({
      next: (templates) => {
        this.templates = templates;
        const hasSelected = !!selectedTemplateId && templates.some(template => template._id === selectedTemplateId);
        this.selectedTemplateId = hasSelected ? selectedTemplateId! : templates[0]?._id || '';
      },
      error: (error) => {
        console.error(this.transloco.translate('competition.templateLoadError'), error);
      }
    });
  }

  private captureSavedSnapshot(): void {
    this.savedBattlesSnapshot = this.serializeBattles(this.battles);
  }

  private hasUnsavedChanges(): boolean {
    return this.savedBattlesSnapshot !== this.serializeBattles(this.battles);
  }

  private serializeBattles(battles: IBattle[]): string {
    return JSON.stringify(this.stripIds(this.normalizeBattles(battles)));
  }

  private clearPendingReplacement(): void {
    this.replaceTemplateDialogVisible = false;
    this.pendingReplacementTemplate = null;
    this.replaceAfterTemplateSave = false;
    this.switchingReplacementDialogToSave = false;
  }

  private collapseAllBattles(): void {
    this.collapsedBattles.clear();
    this.collapsedCategories.clear();
    this.battles.forEach((battle, battleIndex) => {
      this.collapsedBattles.add(this.battleKey(battle, battleIndex));
    });
  }

  private clearCollapseState(): void {
    this.collapsedBattles.clear();
    this.collapsedCategories.clear();
  }
}
